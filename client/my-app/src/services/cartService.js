// cartService.js
import { request } from "./api.js";

export const getCart = () => request("/api/cart", { auth: true });
export const addToCart = (productId, qty = 1) =>
    request("/api/cart", { method: "POST", body: { productId, qty }, auth: true });
export const updateQty = (productId, qty) =>
    request(`/api/cart/${productId}`, { method: "PATCH", body: { qty }, auth: true });
export const removeFromCart = (productId) =>
    request(`/api/cart/${productId}`, { method: "DELETE", auth: true });
