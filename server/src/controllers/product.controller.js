import Product from "../models/Product.js";

// GET /api/products?q=kata
export const listProducts = async (req, res) => {
    const q = String(req.query.q || "").trim();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = q ? { name: new RegExp(escaped, "i") } : {};
    const items = await Product.find(filter).sort({ createdAt: -1 });
    res.json(items);
};

// GET /api/products/:id
export const getProduct = async (req, res) => {
    const item = await Product.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Produk tidak ditemukan" });
    res.json(item);
};

// POST /api/products  (admin) — body sudah divalidasi di route
export const createProduct = async (req, res) => {
    const item = await Product.create(req.validated);
    res.status(201).json(item);
};

// PUT /api/products/:id  (admin) — hanya field yang dikirim yang diubah
export const updateProduct = async (req, res) => {
    const item = await Product.findByIdAndUpdate(req.params.id, req.validated, {
        returnDocument: "after",
        runValidators: true
    });
    if (!item) return res.status(404).json({ error: "Produk tidak ditemukan" });
    res.json(item);
};

// DELETE /api/products/:id  (admin)
export const deleteProduct = async (req, res) => {
    const item = await Product.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Produk tidak ditemukan" });
    res.json({ message: "Produk berhasil dihapus" });
};
