#!/usr/bin/env bash
# deploy.sh: deploy Online Shop dengan pengecekan otomatis di setiap langkah.
#
#   Backend  -> Render  (otomatis setelah git push, atau lewat Deploy Hook)
#   Web      -> Vercel  (otomatis setelah git push, atau lewat Vercel CLI)
#   Mobile   -> Expo    (eas update, menghasilkan link + QR code)
#
# Pertama kali:   cp deploy.env.example deploy.env   (lalu isi)
#                 bash deploy.sh --setup
# Setiap deploy:  bash deploy.sh -m "pesan commit"
# Lihat opsi:     bash deploy.sh --help
#
# Windows: jalankan dari Git Bash (ikut terpasang bersama Git for Windows).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib.sh
. "$ROOT/scripts/lib.sh"

usage() {
    cat <<'EOF'
Pakai: bash deploy.sh [opsi]

  -m, --message "teks"   Commit semua perubahan dengan pesan ini sebelum deploy
  --only backend|web|mobile
                         Deploy satu bagian saja (default: semuanya)
  --check                Hanya pengecekan (install, build, uji start server), tanpa deploy
  --setup                Persiapan sekali jalan (login Expo, expo-updates, Vercel CLI)
  --skip-smoke           Lewati smoke test setelah deploy
  -h, --help             Tampilkan bantuan ini
EOF
}

ONLY="all"
CHECK_ONLY=0
SETUP=0
SKIP_SMOKE=0
COMMIT_MSG=""

while [ $# -gt 0 ]; do
    case "$1" in
        -m|--message) COMMIT_MSG="${2:-}"; shift 2 ;;
        --only) ONLY="${2:-}"; shift 2 ;;
        --check) CHECK_ONLY=1; shift ;;
        --setup) SETUP=1; shift ;;
        --skip-smoke) SKIP_SMOKE=1; shift ;;
        -h|--help) usage; exit 0 ;;
        *) usage; die "Opsi tidak dikenal: $1" ;;
    esac
done

case "$ONLY" in all|backend|web|mobile) ;; *) die "--only harus backend, web, atau mobile" ;; esac
want() { [ "$ONLY" = "all" ] || [ "$ONLY" = "$1" ]; }

# ------------------------------------------------------------------ Konfigurasi
step "Konfigurasi"
load_env_file "$ROOT/deploy.env" \
    || die "File deploy.env belum ada. Jalankan: cp deploy.env.example deploy.env lalu isi URL-nya."

API_URL=$(trim_url "${API_URL:-}")
WEB_URL=$(trim_url "${WEB_URL:-}")
DEPLOY_BRANCH=${DEPLOY_BRANCH:-main}
SERVER_DIR=${SERVER_DIR:-server}
WEB_DIR=${WEB_DIR:-client/my-app}
MOBILE_DIR=${MOBILE_DIR:-online-shop-mobile}
WEB_DEPLOY_MODE=${WEB_DEPLOY_MODE:-git}
EAS_BRANCH=${EAS_BRANCH:-production}
WAIT_TIMEOUT=${WAIT_TIMEOUT:-900}
RENDER_DEPLOY_HOOK_URL=${RENDER_DEPLOY_HOOK_URL:-}

[ -n "$API_URL" ] || die "API_URL di deploy.env masih kosong"
[ -n "$WEB_URL" ] || die "WEB_URL di deploy.env masih kosong"
case "$WEB_DEPLOY_MODE" in git|cli) ;; *) die "WEB_DEPLOY_MODE harus git atau cli" ;; esac
for d in "$SERVER_DIR" "$WEB_DIR" "$MOBILE_DIR"; do [ -d "$d" ] || die "Folder $d tidak ditemukan"; done
ok "Backend $API_URL"
ok "Web     $WEB_URL (mode $WEB_DEPLOY_MODE)"

# ------------------------------------------------------------------ Tools
step "Cek tools"
need_cmd git "Install Git: https://git-scm.com"
need_cmd node "Install Node.js 20 atau lebih baru: https://nodejs.org"
need_cmd npm "npm ikut terpasang bersama Node.js"
need_cmd curl "Install curl (sudah ada di Git Bash dan macOS)"
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" -ge 20 ] || die "Node.js $NODE_MAJOR terlalu lama, butuh versi 20 atau lebih baru"
ok "git, node v$(node -v | tr -d v), npm $(npm -v), curl"

# ------------------------------------------------------------------ Setup sekali jalan
if [ "$SETUP" -eq 1 ]; then
    step "Setup mobile (Expo)"
    (cd "$MOBILE_DIR" && npm install)
    if ! grep -q '"expo-updates"' "$MOBILE_DIR/package.json"; then
        info "Memasang expo-updates (versi yang cocok dengan SDK Expo)..."
        (cd "$MOBILE_DIR" && npx --yes expo install expo-updates)
    fi
    ok "expo-updates terpasang"
    if (cd "$MOBILE_DIR" && npx --yes eas-cli whoami >/dev/null 2>&1); then
        ok "Sudah login Expo sebagai $(cd "$MOBILE_DIR" && npx --yes eas-cli whoami | head -n1)"
    else
        info "Login ke akun Expo pemilik project (lihat 'owner' di app.json)"
        (cd "$MOBILE_DIR" && npx --yes eas-cli login)
    fi

    if [ "$WEB_DEPLOY_MODE" = "cli" ]; then
        step "Setup Vercel CLI"
        (cd "$WEB_DIR" && (npx --yes vercel whoami >/dev/null 2>&1 || npx --yes vercel login))
        (cd "$WEB_DIR" && npx --yes vercel link)
    fi

    step "Setup selesai"
    cat <<EOF
  Langkah berikutnya:
  1. Commit perubahan dari setup:  git add -A && git commit -m "setup deploy"
  2. Di dashboard Render (service backend) > Settings:
       - Health Check Path: /api/health
       - Environment: MONGODB_URI, JWT_SECRET (wajib), CORS_ORIGIN=$WEB_URL (opsional)
  3. Di dashboard Vercel > Settings > Environment Variables:
       - VITE_API_URL=$API_URL
       - VITE_GA_MEASUREMENT_ID=G-xxxxxxxxxx (dari Google Analytics)
  4. Jalankan: bash deploy.sh
EOF
    exit 0
fi

# ------------------------------------------------------------------ Git
step "Cek Git"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Folder ini bukan repository Git"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$CURRENT_BRANCH" = "$DEPLOY_BRANCH" ] \
    || die "Sedang di branch '$CURRENT_BRANCH'. Render/Vercel deploy dari '$DEPLOY_BRANCH'. Jalankan: git checkout $DEPLOY_BRANCH"
git remote get-url origin >/dev/null 2>&1 || die "Remote 'origin' belum ada"

# Cegah rahasia ikut ter-push
FILES=$(git ls-files --cached --others --exclude-standard)
if printf '%s\n' "$FILES" | grep -E '(^|/)\.env$' >/dev/null; then
    die "File .env akan ikut ke GitHub: $(printf '%s\n' "$FILES" | grep -E '(^|/)\.env$' | tr '\n' ' ')
       Hapus dari Git (git rm --cached <file>) dan pastikan .env ada di .gitignore"
fi
LEAKS=$(printf '%s\n' "$FILES" | grep -vE '(^|/)node_modules/|deploy\.env\.example$' \
    | tr '\n' '\0' | xargs -0 grep -IlE 'mongodb(\+srv)?://[^:/@[:space:]]+:[^@[:space:]]+@' 2>/dev/null || true)
[ -z "$LEAKS" ] || die "Password MongoDB tertulis di file: $LEAKS
       Pindahkan ke Environment Variable (Render) atau server/.env, lalu ganti password di Atlas"
ok "Tidak ada .env atau password MongoDB yang ikut ter-commit"

if [ -n "$(git status --porcelain)" ]; then
    if [ -n "$COMMIT_MSG" ]; then
        git add -A
        git commit -q -m "$COMMIT_MSG"
        ok "Perubahan di-commit: $COMMIT_MSG"
    elif [ "$CHECK_ONLY" -eq 1 ]; then
        warn "Ada perubahan yang belum di-commit (tidak masalah untuk --check)"
    else
        git status --short
        die "Ada perubahan yang belum di-commit. Jalankan lagi dengan: bash deploy.sh -m \"pesan commit\""
    fi
else
    ok "Working tree bersih"
fi

info "Mengambil info terbaru dari GitHub..."
git fetch -q origin "$DEPLOY_BRANCH" || die "Gagal git fetch. Cek koneksi internet dan akses ke repository"
BEHIND=$(git rev-list --count "HEAD..origin/$DEPLOY_BRANCH")
[ "$BEHIND" -eq 0 ] || die "Branch lokal tertinggal $BEHIND commit dari GitHub. Jalankan: git pull --rebase origin $DEPLOY_BRANCH"
AHEAD=$(git rev-list --count "origin/$DEPLOY_BRANCH..HEAD")
SHA=$(git rev-parse HEAD)
ok "Commit yang akan di-deploy: ${SHA:0:7} ($AHEAD commit belum di-push)"

# ------------------------------------------------------------------ Cek backend
npm_install() {
    if [ -f package-lock.json ]; then
        npm ci --no-audit --no-fund --loglevel=error \
            || { warn "npm ci gagal di $(pwd), mencoba npm install"; npm install --no-audit --no-fund --loglevel=error; }
    else
        npm install --no-audit --no-fund --loglevel=error
    fi
}

if want backend; then
    step "Cek backend ($SERVER_DIR)"
    (cd "$SERVER_DIR" && npm_install) || die "Install dependency backend gagal"
    ok "Dependency terpasang"

    while IFS= read -r f; do
        node --check "$f" || die "Syntax error di $f"
    done < <(cd "$SERVER_DIR" && find src scripts -name '*.js' 2>/dev/null | sed "s#^#$SERVER_DIR/#")
    ok "Tidak ada syntax error"

    # Uji server bisa start. Sengaja tidak terhubung ke database asli.
    PORT_TEST=5099
    (cd "$SERVER_DIR" && PORT=$PORT_TEST JWT_SECRET=preflight MONGODB_URI="mongodb://127.0.0.1:1/preflight" \
        node src/app.js > "$HTTP_TMP/server.log" 2>&1) &
    SERVER_PID=$!
    STARTED=0
    for _ in $(seq 1 30); do
        http GET "http://localhost:$PORT_TEST/"
        if [ "$HTTP_STATUS" = "200" ]; then STARTED=1; break; fi
        kill -0 "$SERVER_PID" 2>/dev/null || break
        sleep 0.5
    done
    if [ "$STARTED" -eq 1 ]; then
        http GET "http://localhost:$PORT_TEST/api/tidak-ada"
        [ "$HTTP_STATUS" = "404" ] || STARTED=0
        http GET "http://localhost:$PORT_TEST/api/health"
        [ "$(json status)" = "db_disconnected" ] || STARTED=0
    fi
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
    if [ "$STARTED" -ne 1 ]; then
        cat "$HTTP_TMP/server.log" >&2
        die "Server backend tidak bisa start (log di atas)"
    fi
    ok "Server start, route dan error handler terpasang"
fi

# ------------------------------------------------------------------ Cek web
if want web; then
    step "Cek web ($WEB_DIR)"
    [ -f "$WEB_DIR/vercel.json" ] || warn "vercel.json tidak ada, refresh di halaman selain / akan 404 di Vercel"
    (cd "$WEB_DIR" && npm_install) || die "Install dependency web gagal"
    ok "Dependency terpasang"
    if (cd "$WEB_DIR" && npm run -s lint >/dev/null 2>&1); then
        ok "Lint bersih"
    else
        warn "Lint menemukan masalah (jalankan: cd $WEB_DIR && npm run lint). Deploy tetap lanjut"
    fi
    (cd "$WEB_DIR" && VITE_API_URL="$API_URL" APP_COMMIT="$SHA" npm run -s build >"$HTTP_TMP/build.log" 2>&1) \
        || { cat "$HTTP_TMP/build.log" >&2; die "Build web gagal (log di atas)"; }
    [ -f "$WEB_DIR/dist/index.html" ] || die "Build tidak menghasilkan dist/index.html"
    [ -f "$WEB_DIR/dist/version.json" ] || warn "dist/version.json tidak terbentuk, deploy.sh tidak bisa memastikan versi web"
    ok "Build berhasil"
fi

# ------------------------------------------------------------------ Cek mobile
if want mobile; then
    step "Cek mobile ($MOBILE_DIR)"
    node -e '
        const e = require("./'"$MOBILE_DIR"'/app.json").expo;
        if (!e.updates || !e.updates.url) { console.error("app.json belum punya updates.url"); process.exit(1); }
        if (!e.runtimeVersion) { console.error("app.json belum punya runtimeVersion"); process.exit(1); }
    ' || die "Konfigurasi EAS Update belum lengkap"
    grep -q '"expo-updates"' "$MOBILE_DIR/package.json" \
        || die "expo-updates belum terpasang. Jalankan sekali: bash deploy.sh --setup"
    grep -q 'API_URL' "$MOBILE_DIR/config.js" && grep -q "$API_URL" "$MOBILE_DIR/config.js" \
        || warn "API_URL di $MOBILE_DIR/config.js berbeda dengan $API_URL"
    (cd "$MOBILE_DIR" && npm_install) || die "Install dependency mobile gagal"
    (cd "$MOBILE_DIR" && npx --yes eas-cli whoami >/dev/null 2>&1) \
        || die "Belum login Expo. Jalankan: cd $MOBILE_DIR && npx eas-cli login"
    ok "Konfigurasi Expo siap"
fi

if [ "$CHECK_ONLY" -eq 1 ]; then
    step "Selesai (mode --check, tidak ada yang di-deploy)"
    printf "  %s peringatan\n" "$WARNINGS"
    exit 0
fi

# ------------------------------------------------------------------ Push
if want backend || want web; then
    step "Push ke GitHub"
    if [ "$AHEAD" -gt 0 ]; then
        git push origin "$DEPLOY_BRANCH" || die "git push gagal"
        ok "Push ${SHA:0:7} ke origin/$DEPLOY_BRANCH"
    else
        ok "Sudah ter-push sebelumnya"
    fi
fi

# wait_for_commit NAMA URL_JSON FOLDER
# Menunggu sampai URL_JSON melaporkan commit = SHA (dan status 200).
wait_for_commit() {
    local name=$1 url=$2 dir=$3 live="" deadline=$(( $(date +%s) + WAIT_TIMEOUT ))
    while :; do
        http GET "$url?t=$(date +%s)"
        live=$(json commit)
        if [ "$live" = "$SHA" ] && [ "$HTTP_STATUS" = "200" ]; then
            ok "$name sudah menjalankan ${SHA:0:7}"
            return 0
        fi
        # Versi live tidak sama, tapi tidak ada perubahan di folder ini sejak versi live
        if [ -n "$live" ] && [ "$live" != "$SHA" ] && git cat-file -e "$live^{commit}" 2>/dev/null \
            && git diff --quiet "$live" "$SHA" -- "$dir"; then
            ok "$name tidak berubah sejak ${live:0:7}, tidak perlu menunggu"
            return 0
        fi
        [ "$(date +%s)" -lt "$deadline" ] || return 1
        if [ "$live" = "$SHA" ]; then
            info "$name sudah versi baru, menunggu MongoDB terhubung (status $HTTP_STATUS)..."
        else
            info "$name masih versi ${live:0:7}${live:+ }(status $HTTP_STATUS), cek lagi 15 detik..."
        fi
        sleep 15
    done
}

# ------------------------------------------------------------------ Deploy backend
if want backend; then
    step "Deploy backend (Render)"
    if [ -n "$RENDER_DEPLOY_HOOK_URL" ]; then
        http POST "$RENDER_DEPLOY_HOOK_URL"
        case "$HTTP_STATUS" in 2*) ok "Deploy Hook Render dipanggil" ;; *) die "Deploy Hook Render gagal (status $HTTP_STATUS)" ;; esac
    else
        info "Menunggu auto-deploy Render dari GitHub"
    fi
    wait_for_commit "Backend" "$API_URL/api/health" "$SERVER_DIR" || die "Backend belum menjalankan ${SHA:0:7} setelah $((WAIT_TIMEOUT / 60)) menit.
       Cek dashboard Render > Events/Logs. Penyebab umum:
       - Build gagal (lihat log build)
       - Auto-Deploy mati: isi RENDER_DEPLOY_HOOK_URL di deploy.env
       - MONGODB_URI salah atau IP Render belum diizinkan di Atlas (Network Access: 0.0.0.0/0)"
fi

# ------------------------------------------------------------------ Deploy web
if want web; then
    step "Deploy web (Vercel)"
    if [ "$WEB_DEPLOY_MODE" = "cli" ]; then
        (cd "$WEB_DIR" && npx --yes vercel deploy --prod --yes --build-env APP_COMMIT="$SHA") \
            || die "vercel deploy gagal. Sudah jalankan bash deploy.sh --setup?"
    else
        info "Menunggu auto-deploy Vercel dari GitHub"
    fi
    wait_for_commit "Web" "$WEB_URL/version.json" "$WEB_DIR" || die "Web belum menjalankan ${SHA:0:7} setelah $((WAIT_TIMEOUT / 60)) menit.
       Cek dashboard Vercel > Deployments. Pastikan Root Directory = $WEB_DIR
       dan Environment Variable VITE_API_URL sudah di-set"
fi

# ------------------------------------------------------------------ Deploy mobile
if want mobile; then
    step "Publish mobile (Expo EAS Update)"
    MESSAGE=$(git log -1 --pretty=%s)
    (cd "$MOBILE_DIR" && npx --yes eas-cli update --branch "$EAS_BRANCH" --message "$MESSAGE" --non-interactive) \
        || die "eas update gagal (lihat pesan di atas)"
    EXPO_PAGE=$(node -e '
        const e = require("./'"$MOBILE_DIR"'/app.json").expo;
        process.stdout.write(`https://expo.dev/accounts/${e.owner}/projects/${e.slug}/updates`);')
    ok "Update terbit. QR code: buka $EXPO_PAGE, pilih update terbaru, klik Preview"
fi

# ------------------------------------------------------------------ Smoke test
if [ "$SKIP_SMOKE" -eq 0 ] && { want backend || want web; }; then
    bash "$ROOT/scripts/smoke-test.sh" "$API_URL" "$WEB_URL" || die "Smoke test menemukan masalah (lihat baris XX di atas)"
fi

step "Deploy selesai"
printf "  Web:     %s\n  Backend: %s\n" "$WEB_URL" "$API_URL"
want mobile && printf "  Mobile:  %s\n" "${EXPO_PAGE:-}"
printf "  Peringatan: %s\n" "$WARNINGS"
