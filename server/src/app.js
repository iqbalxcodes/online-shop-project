import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import cors from "cors";
import productRoutes from "./routes/product.routes.js";
import userRoutes from "./routes/user.routes.js";

import mongoose from "mongoose";
import { config } from "./config.js";

mongoose
    .connect(config.mongoUri)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB error:", err));

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.get("/", (req, res) => res.json({ message: "API is running" }));
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);

// (middleware error akan ditambahkan di topik 4)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));