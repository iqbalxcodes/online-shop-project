import { Router } from "express";
import mongoose from "mongoose";
import auth, { requireAdmin } from "../middleware/auth.js";
import { validate, PHONE_RE } from "../middleware/validate.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order, { PAYMENT_METHODS, ORDER_STATUSES } from "../models/Order.js";
import User from "../models/User.js";

const router = Router();
router.use(auth);

const checkoutRules = {
    recipientName: { type: "string", required: true, minLength: 2, maxLength: 80, label: "Nama penerima" },
    phone: {
        type: "string", required: true, pattern: PHONE_RE, label: "Nomor telepon",
        patternMessage: "Nomor telepon harus nomor HP Indonesia, contoh 081234567890"
    },
    address: { type: "string", required: true, minLength: 10, maxLength: 300, label: "Alamat" },
    city: { type: "string", required: true, minLength: 2, maxLength: 60, label: "Kota" },
    postalCode: {
        type: "string", required: true, pattern: /^\d{5}$/, label: "Kode pos",
        patternMessage: "Kode pos harus 5 digit angka"
    },
    paymentMethod: { type: "string", required: true, enum: PAYMENT_METHODS, label: "Metode pembayaran" },
    note: { type: "string", maxLength: 300, label: "Catatan" }
};

const restoreStock = (reserved) =>
    Promise.all(reserved.map((r) => Product.updateOne({ _id: r.product }, { $inc: { stock: r.qty } })));

const isAdmin = async (userId) => (await User.findById(userId).select("role"))?.role === "admin";

// POST /api/orders — checkout semua isi keranjang
router.post("/", validate(checkoutRules), async (req, res) => {
    const cart = await Cart.findOne({ user: req.userId }).populate("items.product");
    const items = cart ? cart.items.filter((i) => i.product) : [];

    if (items.length === 0) {
        return res.status(400).json({ error: "Keranjang masih kosong" });
    }

    // Kurangi stok produk satu per satu. Update hanya berhasil kalau stok masih cukup,
    // jadi dua pembeli yang checkout bersamaan tidak bisa membuat stok minus.
    const reserved = [];
    for (const { product, qty } of items) {
        const updated = await Product.findOneAndUpdate(
            { _id: product._id, stock: { $gte: qty } },
            { $inc: { stock: -qty } }
        );
        if (!updated) {
            await restoreStock(reserved);
            return res.status(409).json({ error: `Stok "${product.name}" tidak mencukupi` });
        }
        reserved.push({ product: product._id, qty });
    }

    try {
        const { paymentMethod, note, ...shipping } = req.validated;
        const orderItems = items.map(({ product, qty }) => ({
            product: product._id,
            name: product.name,
            image: product.image,
            price: product.price,
            qty
        }));
        const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

        const order = await Order.create({
            user: req.userId,
            items: orderItems,
            shipping,
            paymentMethod,
            note,
            total
        });

        cart.items = [];
        await cart.save();

        res.status(201).json(order);
    } catch (err) {
        await restoreStock(reserved);
        throw err;
    }
});

// GET /api/orders — riwayat pesanan milik user yang login
router.get("/", async (req, res) => {
    res.json(await Order.find({ user: req.userId }).sort({ createdAt: -1 }));
});

// GET /api/orders/:id — detail satu pesanan (pemilik atau admin)
router.get("/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: "Format id tidak valid" });
    }
    const order = await Order.findById(req.params.id);
    if (!order || (!order.user.equals(req.userId) && !(await isAdmin(req.userId)))) {
        return res.status(404).json({ error: "Pesanan tidak ditemukan" });
    }
    res.json(order);
});

// PATCH /api/orders/:id/cancel — batalkan pesanan yang masih pending, stok dikembalikan
router.patch("/:id/cancel", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: "Format id tidak valid" });
    }
    const order = await Order.findOneAndUpdate(
        { _id: req.params.id, user: req.userId, status: "pending" },
        { status: "cancelled" },
        { returnDocument: "after" }
    );
    if (!order) {
        return res.status(400).json({ error: "Pesanan tidak ditemukan atau sudah tidak bisa dibatalkan" });
    }
    await restoreStock(order.items.map((i) => ({ product: i.product, qty: i.qty })));
    res.json(order);
});

// PATCH /api/orders/:id/status — admin mengubah status pesanan
router.patch(
    "/:id/status",
    requireAdmin,
    validate({ status: { type: "string", required: true, enum: ORDER_STATUSES, label: "Status" } }),
    async (req, res) => {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Pesanan tidak ditemukan" });
        if (order.status === "cancelled") {
            return res.status(400).json({ error: "Pesanan yang sudah dibatalkan tidak bisa diubah" });
        }

        order.status = req.validated.status;
        await order.save();

        // Pesanan yang dibatalkan admin juga mengembalikan stok
        if (order.status === "cancelled") {
            await restoreStock(order.items.map((i) => ({ product: i.product, qty: i.qty })));
        }
        res.json(order);
    }
);

export default router;
