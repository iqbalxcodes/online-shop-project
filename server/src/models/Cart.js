import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        items: [
            {
                _id: false,
                product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
                qty: { type: Number, min: 1, default: 1 }
            }
        ]
    },
    { timestamps: true }
);
export default mongoose.model("Cart", cartSchema);