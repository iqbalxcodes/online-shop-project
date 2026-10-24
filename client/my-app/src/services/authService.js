// authService.js
const API_URL = (import.meta.env.VITE_API_URL || "https://online-shop-project-gfe0.onrender.com") + "/api/users";

export async function register(name, email, password) {
    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Registrasi gagal");
    }

    return data;
}

export async function login(email, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Login gagal");
    }

    localStorage.setItem("token", data.token);

    return data;
}

export function logout() {
    localStorage.removeItem("token");
}
