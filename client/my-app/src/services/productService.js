// productService.js
const API_URL = import.meta.env.VITE_API_URL || "https://online-shop-api-w40i.onrender.com";

export async function getProducts() {
    const response = await fetch(`${API_URL}/api/products`);

    if (!response.ok) {
        throw new Error("Gagal mengambil produk");
    }

    return response.json();
}

export async function getProductById(id) {
    const response = await fetch(`${API_URL}/api/products/${id}`);

    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }

        throw new Error("Gagal mengambil produk");
    }

    return response.json();
}
