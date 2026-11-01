import { Router } from "express";
import {
    listProducts, getProduct, createProduct, updateProduct, deleteProduct
} from "../controllers/product.controller.js";
import auth, { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const productRules = {
    name: { type: "string", required: true, minLength: 2, maxLength: 120, label: "Nama produk" },
    price: { type: "number", required: true, min: 0, label: "Harga" },
    stock: { type: "integer", min: 0, label: "Stok" },
    image: { type: "url", maxLength: 500, label: "URL gambar", allowEmpty: true },
    description: { type: "string", maxLength: 2000, label: "Deskripsi", allowEmpty: true }
};

const router = Router();

// Publik: siapa saja boleh melihat produk
router.get("/", listProducts);
router.get("/:id", getProduct);

// Hanya admin yang boleh menambah, mengubah, dan menghapus produk
router.post("/", auth, requireAdmin, validate(productRules), createProduct);
router.put("/:id", auth, requireAdmin, validate(productRules, { partial: true }), updateProduct);
router.delete("/:id", auth, requireAdmin, deleteProduct);

export default router;
