import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Cart from "../models/Cart.js";
import auth, { requireAdmin } from "../middleware/auth.js";
import { validate, PHONE_RE } from "../middleware/validate.js";
import { httpError } from "../middleware/errorHandler.js";

const router = Router();

// ---------- Aturan validasi ----------
const profileRules = {
    name: { type: "string", required: true, minLength: 2, maxLength: 50, label: "Nama" },
    email: { type: "email", required: true, maxLength: 100, label: "Email" },
    password: { type: "string", required: true, minLength: 6, maxLength: 72, label: "Password" },
    phone: {
        type: "string", pattern: PHONE_RE, label: "Nomor telepon", allowEmpty: true,
        patternMessage: "Nomor telepon harus nomor HP Indonesia, contoh 081234567890"
    },
    address: { type: "string", maxLength: 300, label: "Alamat", allowEmpty: true }
};

const loginRules = {
    email: { type: "email", required: true, label: "Email" },
    password: { type: "string", required: true, label: "Password" }
};

// Admin boleh mengubah role, user biasa tidak
const adminUpdateRules = {
    ...profileRules,
    role: { type: "string", enum: ["user", "admin"], label: "Role" }
};

// ---------- Helper ----------
async function updateUser(id, data) {
    const update = { ...data };

    if (update.email) {
        const taken = await User.exists({ email: update.email, _id: { $ne: id } });
        if (taken) throw httpError(409, "Email sudah dipakai akun lain");
    }
    if (update.password) {
        update.passwordHash = await bcrypt.hash(update.password, 10);
        delete update.password;
    }

    const user = await User.findByIdAndUpdate(id, update, {
        returnDocument: "after",
        runValidators: true
    });
    if (!user) throw httpError(404, "User tidak ditemukan");
    return user;
}

async function deleteUser(id) {
    const user = await User.findByIdAndDelete(id);
    if (!user) throw httpError(404, "User tidak ditemukan");
    await Cart.deleteOne({ user: id });
    // Riwayat pesanan sengaja tidak dihapus (catatan transaksi tetap disimpan)
}

// ---------- Autentikasi ----------

// POST /api/users/register
router.post("/register", validate(profileRules), async (req, res) => {
    const { password, ...data } = req.validated;

    if (await User.exists({ email: data.email })) {
        return res.status(409).json({ error: "Email sudah terdaftar" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ ...data, passwordHash });

    res.status(201).json({ message: "Registrasi berhasil", user });
});

// POST /api/users/login
router.post("/login", validate(loginRules), async (req, res) => {
    const { email, password } = req.validated;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Email atau password salah" });
    }

    const token = jwt.sign(
        { sub: String(user._id), role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );

    res.json({ token, user });
});

// ---------- Akun sendiri (/me) ----------
// Harus didaftarkan sebelum "/:id" supaya "me" tidak dianggap sebagai id.

// GET /api/users/me
router.get("/me", auth, async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
    res.json(user);
});

// PUT /api/users/me
router.put("/me", auth, validate(profileRules, { partial: true }), async (req, res) => {
    res.json(await updateUser(req.userId, req.validated));
});

// DELETE /api/users/me
router.delete("/me", auth, async (req, res) => {
    await deleteUser(req.userId);
    res.json({ message: "Akun berhasil dihapus" });
});

// ---------- Manajemen user oleh admin ----------

// GET /api/users?q=kata
router.get("/", auth, requireAdmin, async (req, res) => {
    const q = String(req.query.q || "").trim();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = q
        ? { $or: [{ name: new RegExp(escaped, "i") }, { email: new RegExp(escaped, "i") }] }
        : {};
    res.json(await User.find(filter).sort({ createdAt: -1 }));
});

// GET /api/users/:id
router.get("/:id", auth, requireAdmin, async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
    res.json(user);
});

// PUT /api/users/:id
router.put("/:id", auth, requireAdmin, validate(adminUpdateRules, { partial: true }), async (req, res) => {
    res.json(await updateUser(req.params.id, req.validated));
});

// DELETE /api/users/:id
router.delete("/:id", auth, requireAdmin, async (req, res) => {
    await deleteUser(req.params.id);
    res.json({ message: "User berhasil dihapus" });
});

export default router;
