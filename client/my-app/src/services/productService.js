// productService.js
import { request } from "./api.js";

export function getProducts() {
    return request("/api/products");
}

export async function getProductById(id) {
    try {
        return await request(`/api/products/${id}`);
    } catch (error) {
        // 404 = produk tidak ada, 400 = format id salah
        if (error.status === 404 || error.status === 400) return null;
        throw error;
    }
}
