import { Router } from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const router = Router();
router.use(auth);

const load = async (userId) => (await Cart.findOne({ user: userId })) || new Cart({ user: userId });
const out = async (cart, res) => {
    await cart.populate("items.product");
    res.json(cart.items.filter((i) => i.product)); // buang produk yang sudah dihapus
};
const badQty = (qty) => !Number.isInteger(qty) || qty < 1;

// GET /api/cart
router.get("/", async (req, res) => out(await load(req.userId), res));

// POST /api/cart  { productId, qty }
router.post("/", async (req, res) => {
    const { productId, qty = 1 } = req.body ?? {};
    if (badQty(qty)) return res.status(400).json({ error: "Qty tidak valid" });

    const product = mongoose.isValidObjectId(productId) ? await Product.findById(productId) : null;
    if (!product) return res.status(404).json({ error: "Produk tidak ditemukan" });

    const cart = await load(req.userId);
    const item = cart.items.find((i) => i.product.equals(productId));
    const newQty = (item ? item.qty : 0) + qty;

    if (newQty > product.stock) {
        return res.status(400).json({ error: `Stok tidak cukup (tersisa ${product.stock})` });
    }

    if (item) item.qty = newQty;
    else cart.items.push({ product: productId, qty });
    await cart.save();
    await out(cart, res);
});

// PATCH /api/cart/:productId  { qty }
router.patch("/:productId", async (req, res) => {
    const { qty } = req.body ?? {};
    if (badQty(qty)) return res.status(400).json({ error: "Qty tidak valid" });

    const cart = await load(req.userId);
    const item = cart.items.find((i) => i.product.equals(req.params.productId));
    if (!item) return res.status(404).json({ error: "Item tidak ada di keranjang" });

    const product = await Product.findById(req.params.productId);
    if (product && qty > product.stock) {
        return res.status(400).json({ error: `Stok tidak cukup (tersisa ${product.stock})` });
    }

    item.qty = qty;
    await cart.save();
    await out(cart, res);
});

// DELETE /api/cart/:productId
router.delete("/:productId", async (req, res) => {
    const cart = await load(req.userId);
    cart.items = cart.items.filter((i) => !i.product.equals(req.params.productId));
    await cart.save();
    await out(cart, res);
});

export default router;
