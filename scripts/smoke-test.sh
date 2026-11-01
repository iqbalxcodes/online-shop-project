#!/usr/bin/env bash
# smoke-test.sh: mengecek backend (Render) dan web (Vercel) yang SUDAH live.
#
# Pakai:  bash scripts/smoke-test.sh
#         bash scripts/smoke-test.sh https://api-kamu.onrender.com https://web-kamu.vercel.app
#
# Membuat 1 akun uji sementara, lalu langsung menghapusnya lagi di akhir.
# Tidak membuat pesanan dan tidak mengubah stok produk.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=lib.sh
. "$ROOT/scripts/lib.sh"

load_env_file "$ROOT/deploy.env" || true
API_URL=$(trim_url "${1:-${API_URL:-}}")
WEB_URL=$(trim_url "${2:-${WEB_URL:-}}")
[ -n "$API_URL" ] || die "API_URL kosong. Isi di deploy.env atau kirim sebagai argumen pertama."
[ -n "$WEB_URL" ] || die "WEB_URL kosong. Isi di deploy.env atau kirim sebagai argumen kedua."
need_cmd curl "Install curl dulu."
need_cmd node "Install Node.js dulu."

PASS=0
FAIL=0
pass() { PASS=$((PASS + 1)); ok "$*"; }
fail() { FAIL=$((FAIL + 1)); printf "  %sXX%s  %s\n" "$RED" "$RESET" "$*"; }

# expect STATUS "deskripsi"
expect() {
    if [ "$HTTP_STATUS" = "$1" ]; then
        pass "$2"
    else
        local snippet
        snippet=$(printf '%s' "$HTTP_BODY" | tr '\n' ' ' | cut -c1-160)
        fail "$2 (status $HTTP_STATUS, seharusnya $1) $snippet"
    fi
}

# ---------------------------------------------------------------- Backend
step "Backend: $API_URL"
info "Request pertama bisa lambat (server gratis Render sedang bangun)..."

http GET "$API_URL/"
expect 200 "GET / (API hidup)"

http GET "$API_URL/api/health"
if [ "$HTTP_STATUS" = "200" ]; then
    pass "GET /api/health: MongoDB terhubung (commit $(json commit | cut -c1-7))"
elif [ "$HTTP_STATUS" = "503" ]; then
    fail "MongoDB TIDAK terhubung. Cek MONGODB_URI di Render dan Network Access di Atlas (izinkan 0.0.0.0/0)"
else
    fail "GET /api/health status $HTTP_STATUS (backend versi lama atau belum ter-deploy?)"
fi

http GET "$API_URL/api/products"
expect 200 "GET /api/products"
COUNT=$(json length)
FIRST_ID=$(json 0._id)
if [ -n "$COUNT" ] && [ "$COUNT" -gt 0 ] 2>/dev/null; then
    pass "Ada $COUNT produk di database"
else
    warn "Daftar produk kosong. Tambahkan produk lewat akun admin."
fi

if [ -n "$FIRST_ID" ]; then
    http GET "$API_URL/api/products/$FIRST_ID"
    expect 200 "GET /api/products/:id"
fi

http GET "$API_URL/api/products/id-salah"
expect 400 "ID produk tidak valid ditolak (400)"

http POST "$API_URL/api/products" '{"name":"Uji","price":1}'
expect 401 "Tambah produk tanpa login ditolak (401)"

http POST "$API_URL/api/users/register" '{}'
expect 400 "Validasi register: body kosong ditolak (400)"

http GET "$API_URL/api/orders"
expect 401 "Riwayat pesanan tanpa login ditolak (401)"

# Alur akun uji: register -> login -> profil -> checkout keranjang kosong -> hapus akun
STAMP="$(date +%s)$RANDOM"
EMAIL="smoketest-$STAMP@example.com"
PASSWORD="Uji-$STAMP"
TOKEN=""

cleanup_user() {
    if [ -n "$TOKEN" ]; then
        http DELETE "$API_URL/api/users/me" "" "$TOKEN"
        if [ "$HTTP_STATUS" = "200" ]; then pass "Akun uji dihapus lagi"; else fail "Akun uji $EMAIL gagal dihapus (status $HTTP_STATUS)"; fi
        TOKEN=""
    fi
}

http POST "$API_URL/api/users/register" "{\"name\":\"Smoke Test\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
expect 201 "Register akun uji"

http POST "$API_URL/api/users/login" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
expect 200 "Login (JWT_SECRET di Render sudah benar)"
TOKEN=$(json token)

if [ -n "$TOKEN" ]; then
    http GET "$API_URL/api/users/me" "" "$TOKEN"
    expect 200 "GET /api/users/me dengan token"

    http PUT "$API_URL/api/users/me" '{"phone":"081234567890"}' "$TOKEN"
    expect 200 "PUT /api/users/me (update profil)"

    http GET "$API_URL/api/cart" "" "$TOKEN"
    expect 200 "GET /api/cart dengan token"

    http POST "$API_URL/api/orders" '{"recipientName":"Smoke Test","phone":"081234567890","address":"Jalan Uji Coba No. 1","city":"Jakarta","postalCode":"12345","paymentMethod":"cod"}' "$TOKEN"
    if [ "$HTTP_STATUS" = "400" ] && printf '%s' "$HTTP_BODY" | grep -q "Keranjang"; then
        pass "Endpoint checkout aktif (keranjang kosong ditolak)"
    else
        fail "Endpoint checkout: status $HTTP_STATUS, seharusnya 400 'Keranjang masih kosong'"
    fi

    http GET "$API_URL/api/orders" "" "$TOKEN"
    expect 200 "GET /api/orders dengan token"

    cleanup_user
else
    fail "Tidak dapat token dari login, langkah berikutnya dilewati"
fi

CORS=$(curl -sS -m "$CURL_TIMEOUT" -o /dev/null -D - -H "Origin: $WEB_URL" "$API_URL/api/products" 2>/dev/null \
    | tr -d '\r' | grep -i '^access-control-allow-origin:' | cut -d' ' -f2-)
if [ "$CORS" = "*" ] || [ "$CORS" = "$WEB_URL" ]; then
    pass "CORS mengizinkan $WEB_URL"
else
    fail "CORS tidak mengizinkan $WEB_URL (header: '${CORS:-tidak ada}'). Cek CORS_ORIGIN di Render"
fi

# ---------------------------------------------------------------- Web
step "Web: $WEB_URL"

http GET "$WEB_URL/"
if [ "$HTTP_STATUS" = "200" ] && printf '%s' "$HTTP_BODY" | grep -q 'id="root"'; then
    pass "Halaman utama terbuka"
else
    fail "Halaman utama status $HTTP_STATUS"
fi
INDEX_HTML=$HTTP_BODY

http GET "$WEB_URL/checkout"
if [ "$HTTP_STATUS" = "200" ] && printf '%s' "$HTTP_BODY" | grep -q 'id="root"'; then
    pass "Refresh di /checkout tidak 404 (vercel.json rewrites aktif)"
else
    fail "/checkout status $HTTP_STATUS. Pastikan client/my-app/vercel.json ikut ter-deploy"
fi

http GET "$WEB_URL/version.json?t=$STAMP"
WEB_COMMIT=$(json commit)
if [ -n "$WEB_COMMIT" ]; then pass "version.json: commit ${WEB_COMMIT:0:7}"; else warn "version.json belum ada (web versi lama?)"; fi

BUNDLE_PATH=$(printf '%s' "$INDEX_HTML" | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -n1)
if [ -n "$BUNDLE_PATH" ]; then
    http GET "$WEB_URL$BUNDLE_PATH"
    API_HOST=${API_URL#*://}
    if printf '%s' "$HTTP_BODY" | grep -q "$API_HOST"; then
        pass "Web memanggil backend $API_HOST"
    else
        fail "Bundle web tidak berisi $API_HOST. Cek Environment Variable VITE_API_URL di Vercel lalu redeploy"
    fi
    GA_ID=$(printf '%s' "$HTTP_BODY" | grep -oE 'G-[A-Z0-9]{6,12}' | head -n1)
    if [ -n "$GA_ID" ]; then
        pass "Google Analytics aktif ($GA_ID)"
    else
        warn "Google Analytics belum aktif: isi VITE_GA_MEASUREMENT_ID di Vercel lalu redeploy"
    fi
else
    fail "Tidak menemukan file JavaScript utama di index.html"
fi

# ---------------------------------------------------------------- Ringkasan
step "Hasil smoke test"
printf "  %s lolos, %s gagal, %s peringatan\n" "$PASS" "$FAIL" "$WARNINGS"
if [ "$FAIL" -gt 0 ]; then
    printf "  %sAda yang gagal. Lihat baris XX di atas.%s\n" "$RED" "$RESET"
    exit 1
fi
printf "  %sSemua cek penting lolos.%s\n" "$GREEN" "$RESET"
