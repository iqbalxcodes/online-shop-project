const API_URL = (import.meta.env.VITE_API_URL || "https://online-shop-project-gfe0.onrender.com") + "/api/cart";

async function call(path = "", method = "GET", body) {
    const response = await fetch(API_URL + path, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: body && JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Gagal memproses keranjang");
    }

    return data;
}

export const getCart = () => call();
export const addToCart = (productId, qty = 1) => call("", "POST", { productId, qty });
export const updateQty = (productId, qty) => call(`/${productId}`, "PATCH", { qty });
export const removeFromCart = (productId) => call(`/${productId}`, "DELETE");