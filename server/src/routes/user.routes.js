
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

// Register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ error: "Email sudah terdaftar" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await User.create({ name, email, passwordHash });

        res.status(201).json({ message: "Registrasi berhasil" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});


router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: "Email atau password salah" });
        }

        const token = jwt.sign(
            { sub: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES || "7d" }
        );

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/me", async (req, res) => {
    const header = req.headers.authorization;
    const token = header && header.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.sub).select("-passwordHash");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
});

export default router;