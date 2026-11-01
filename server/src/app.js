import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import cors from "cors";
import mongoose from "mongoose";

import productRoutes from "./routes/product.routes.js";
import userRoutes from "./routes/user.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { config } from "./config.js";

if (!process.env.JWT_SECRET) {
    console.warn("PERINGATAN: JWT_SECRET belum di-set. Login dan endpoint yang butuh token akan gagal.");
}

mongoose
    .connect(config.mongoUri)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB error:", err.message));

const app = express();

// CORS_ORIGIN opsional, contoh: https://online-shop-project-chi.vercel.app
// Kalau tidak di-set, semua origin diizinkan (supaya Expo/web lokal tetap bisa akses).
app.use(cors(config.corsOrigin ? { origin: config.corsOrigin } : undefined));
app.use(morgan("dev"));
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => res.json({ message: "API is running" }));

// Dipakai deploy.sh dan "Health Check Path" di Render.
// 503 kalau MongoDB belum terhubung, supaya deploy yang rusak tidak dianggap sehat.
app.get("/api/health", (req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({
        status: dbUp ? "ok" : "db_disconnected",
        commit: process.env.RENDER_GIT_COMMIT || process.env.APP_COMMIT || "local",
        uptimeSeconds: Math.round(process.uptime())
    });
});
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
