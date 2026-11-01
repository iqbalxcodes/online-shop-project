import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        name: { type: String, required: true, trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        phone: { type: String, default: "", trim: true },
        address: { type: String, default: "", trim: true }
    },
    { timestamps: true }
);

// passwordHash tidak pernah ikut terkirim ke client
userSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model("User", userSchema);
