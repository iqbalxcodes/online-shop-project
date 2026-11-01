import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Wajib login: header "Authorization: Bearer <token>"
export default function auth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Silakan login terlebih dahulu" });

    try {
        req.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
        next();
    } catch {
        res.status(401).json({ error: "Token tidak valid atau sudah kedaluwarsa" });
    }
}

// Wajib admin. Dipakai setelah auth.
// Role dibaca dari database (bukan dari token) supaya perubahan role langsung berlaku.
export async function requireAdmin(req, res, next) {
    const user = await User.findById(req.userId).select("role");
    if (!user) return res.status(401).json({ error: "Akun tidak ditemukan" });
    if (user.role !== "admin") {
        return res.status(403).json({ error: "Hanya admin yang boleh melakukan aksi ini" });
    }
    next();
}
