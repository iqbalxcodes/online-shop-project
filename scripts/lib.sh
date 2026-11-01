#!/usr/bin/env bash
# Fungsi bersama untuk deploy.sh dan smoke-test.sh.
# Hanya butuh bash, curl, git, dan node (tidak butuh jq), jadi jalan di Git Bash (Windows), macOS, dan Linux.

if [ -t 1 ]; then
    RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
    RED=""; GREEN=""; YELLOW=""; BOLD=""; DIM=""; RESET=""
fi

WARNINGS=${WARNINGS:-0}
CURL_TIMEOUT=${CURL_TIMEOUT:-90}   # server gratis Render bisa butuh ±1 menit untuk bangun

step() { printf "\n%s==> %s%s\n" "$BOLD" "$*" "$RESET"; }
ok()   { printf "  %sOK%s  %s\n" "$GREEN" "$RESET" "$*"; }
info() { printf "  %s..%s  %s\n" "$DIM" "$RESET" "$*"; }
warn() { printf "  %s!!%s  %s\n" "$YELLOW" "$RESET" "$*"; WARNINGS=$((WARNINGS + 1)); }
die()  { printf "\n%sGAGAL:%s %s\n" "$RED" "$RESET" "$*" >&2; exit 1; }

need_cmd() {
    command -v "$1" >/dev/null 2>&1 || die "Perintah '$1' tidak ditemukan. $2"
}

# Membaca file KEY=VALUE (aman untuk file dengan akhir baris Windows/CRLF)
load_env_file() {
    local file=$1
    [ -f "$file" ] || return 1
    set -a
    eval "$(tr -d '\r' < "$file" | grep -E '^[A-Za-z_][A-Za-z0-9_]*=')"
    set +a
}

# Folder sementara untuk body respons HTTP
HTTP_TMP=$(mktemp -d 2>/dev/null || mktemp -d -t deploy)
trap 'rm -rf "$HTTP_TMP"' EXIT

# http METHOD URL [JSON_BODY] [TOKEN]  -> mengisi HTTP_STATUS dan HTTP_BODY
http() {
    local method=$1 url=$2 body=${3:-} token=${4:-}
    local args=(-sS -m "$CURL_TIMEOUT" -X "$method" -o "$HTTP_TMP/body" -w "%{http_code}")
    [ -n "$body" ] && args+=(-H "Content-Type: application/json" --data "$body")
    [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
    : > "$HTTP_TMP/body"
    HTTP_STATUS=$(curl "${args[@]}" "$url" 2>/dev/null) || true
    [ -z "$HTTP_STATUS" ] && HTTP_STATUS="000"
    HTTP_BODY=$(cat "$HTTP_TMP/body" 2>/dev/null || true)
}

# json "a.b.0.c"  -> ambil nilai dari HTTP_BODY (kosong kalau tidak ada / bukan JSON)
json() {
    printf '%s' "$HTTP_BODY" | node -e '
        let s = "";
        process.stdin.on("data", (d) => (s += d)).on("end", () => {
            try {
                const v = process.argv[1].split(".").reduce((o, k) => (o == null ? undefined : o[k]), JSON.parse(s));
                if (v !== undefined && v !== null) process.stdout.write(typeof v === "object" ? JSON.stringify(v) : String(v));
            } catch {}
        });' "$1"
}

# Membuang "/" di akhir URL
trim_url() { printf '%s' "${1%/}"; }
