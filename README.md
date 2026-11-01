# Online Shop (FC Bayern Store)

Marketplace merchandise dengan versi web (React), mobile (React Native + Expo), dan satu backend REST API (Express + MongoDB).

| Bagian | Teknologi | Deploy |
| --- | --- | --- |
| Web | React 19, Vite, React Router | Vercel: https://online-shop-project-chi.vercel.app |
| Backend | Node.js, Express 5, Mongoose, JWT | Render: https://online-shop-project-gfe0.onrender.com |
| Database | MongoDB Atlas | - |
| Mobile | React Native, Expo, AsyncStorage | Expo EAS Update (QR code) |

## Struktur folder

```
server/               Backend REST API
  src/app.js          Entry point (dipakai Render: npm start)
  src/routes/         users, products, cart, orders
  src/middleware/     auth (JWT + admin), validate, errorHandler
  src/models/         User, Product, Cart, Order
  scripts/make-admin.js
client/my-app/        Web React (Vite)
  src/pages/          Home, Product, ProductDetail, Cart, Checkout, OrderDetail, Profile, Login, Register
  src/services/       Pemanggilan API (fetch)
  vercel.json         Supaya refresh di /checkout dll tidak 404
online-shop-mobile/   Aplikasi Expo
  App.js, screens/    Login, Daftar Produk, Detail Produk
  config.js           URL backend
deploy.sh             Deploy otomatis + pengecekan
scripts/smoke-test.sh Cek API dan web yang sudah live
```

## Menjalankan di komputer sendiri

Butuh Node.js 20 atau lebih baru.

### 1. Backend

```bash
cd server
npm install
```

Buat file `server/.env`:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/spd_lab?retryWrites=true&w=majority
JWT_SECRET=isi-dengan-teks-acak-panjang
JWT_EXPIRES=7d
# CORS_ORIGIN=http://localhost:5173   (opsional, default semua origin boleh)
```

```bash
npm run dev        # http://localhost:5000
```

### 2. Web

```bash
cd client/my-app
npm install
echo "VITE_API_URL=http://localhost:5000" > .env.local
npm run dev        # http://localhost:5173
```

Opsional: `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` untuk Google Analytics.

### 3. Mobile

Ubah `API_URL` di `online-shop-mobile/config.js` kalau ingin memakai backend lokal (pakai IP laptop, bukan `localhost`).

```bash
cd online-shop-mobile
npm install
npx expo start     # scan QR dengan aplikasi Expo Go
```

### 4. Membuat akun admin

Tambah, ubah, dan hapus produk hanya boleh oleh admin. Register akun lewat web, lalu:

```bash
cd server
npm run make-admin -- email@kamu.com
```

## Deploy

```bash
cp deploy.env.example deploy.env   # isi API_URL dan WEB_URL
bash deploy.sh --setup             # sekali saja: login Expo, pasang expo-updates
bash deploy.sh -m "pesan commit"   # cek, push, tunggu Render & Vercel, publish Expo, smoke test
```

Di Windows jalankan dari **Git Bash**. Opsi lain: `--check` (cek saja), `--only backend|web|mobile`, `--help`.

Pengaturan yang perlu ada:

| Tempat | Isi |
| --- | --- |
| Render > Environment | `MONGODB_URI`, `JWT_SECRET`, opsional `CORS_ORIGIN` |
| Render > Settings | Health Check Path: `/api/health` |
| Vercel > Settings | Root Directory: `client/my-app` |
| Vercel > Environment Variables | `VITE_API_URL`, `VITE_GA_MEASUREMENT_ID` |
| MongoDB Atlas > Network Access | `0.0.0.0/0` (Render tidak punya IP tetap) |

## Ringkasan API

| Method | Endpoint | Akses |
| --- | --- | --- |
| POST | `/api/users/register`, `/api/users/login` | Publik |
| GET, PUT, DELETE | `/api/users/me` | Login |
| GET | `/api/users`, `/api/users/:id` | Admin |
| PUT, DELETE | `/api/users/:id` | Admin |
| GET | `/api/products`, `/api/products/:id` | Publik |
| POST, PUT, DELETE | `/api/products`, `/api/products/:id` | Admin |
| GET, POST | `/api/cart` | Login |
| PATCH, DELETE | `/api/cart/:productId` | Login |
| POST, GET | `/api/orders` | Login (POST = checkout) |
| GET | `/api/orders/:id` | Pemilik atau admin |
| PATCH | `/api/orders/:id/cancel` | Pemilik, selama status pending |
| PATCH | `/api/orders/:id/status` | Admin |
| GET | `/api/health` | Publik (cek server + database) |

Input yang tidak valid dijawab `400` dengan pesan per field, contoh:

```json
{ "error": "Kode pos harus 5 digit angka", "details": { "postalCode": "Kode pos harus 5 digit angka" } }
```
