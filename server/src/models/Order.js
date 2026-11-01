import mongoose from "mongoose";

export const PAYMENT_METHODS = ["transfer", "cod", "ewallet"];
export const ORDER_STATUSES = ["pending", "paid", "shipped", "completed", "cancelled"];

// Nama, gambar, dan harga disalin saat checkout supaya riwayat pesanan
// tidak berubah walaupun produknya nanti diedit atau dihapus.
const orderItemSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        image: { type: String, default: "" },
        price: { type: Number, required: true, min: 0 },
        qty: { type: Number, required: true, min: 1 }
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        items: {
            type: [orderItemSchema],
            validate: { validator: (v) => v.length > 0, message: "Pesanan minimal berisi 1 produk" }
        },
        shipping: {
            recipientName: { type: String, required: true, trim: true },
            phone: { type: String, required: true, trim: true },
            address: { type: String, required: true, trim: true },
            city: { type: String, required: true, trim: true },
            postalCode: { type: String, required: true, trim: true }
        },
        paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
        note: { type: String, default: "", trim: true },
        total: { type: Number, required: true, min: 0 },
        status: { type: String, enum: ORDER_STATUSES, default: "pending" }
    },
    { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
