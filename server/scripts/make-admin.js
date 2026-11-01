// Menjadikan sebuah akun sebagai admin.
// Jalankan dari folder server:  npm run make-admin -- email@contoh.com
// Butuh MONGODB_URI di file server/.env (sama dengan yang dipakai di Render).
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../src/models/User.js";
import { config } from "../src/config.js";

const email = process.argv[2]?.toLowerCase().trim();
if (!email) {
    console.error("Cara pakai: npm run make-admin -- email@contoh.com");
    process.exit(1);
}

await mongoose.connect(config.mongoUri);
const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { returnDocument: "after" });

if (user) console.log(`${user.email} sekarang admin.`);
else console.error(`Akun ${email} tidak ditemukan. Register dulu lewat web, lalu jalankan lagi.`);

await mongoose.disconnect();
process.exit(user ? 0 : 1);
