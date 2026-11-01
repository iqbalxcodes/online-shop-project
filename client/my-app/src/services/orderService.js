// orderService.js
import { request } from "./api.js";

export const PAYMENT_LABELS = {
    transfer: "Transfer Bank",
    ewallet: "E-Wallet",
    cod: "Bayar di Tempat (COD)"
};

export const STATUS_LABELS = {
    pending: "Menunggu pembayaran",
    paid: "Dibayar",
    shipped: "Dikirim",
    completed: "Selesai",
    cancelled: "Dibatalkan"
};

export const createOrder = (data) => request("/api/orders", { method: "POST", body: data, auth: true });
export const getOrders = () => request("/api/orders", { auth: true });
export const getOrder = (id) => request(`/api/orders/${id}`, { auth: true });
export const cancelOrder = (id) => request(`/api/orders/${id}/cancel`, { method: "PATCH", auth: true });
