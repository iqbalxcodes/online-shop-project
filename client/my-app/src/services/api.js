// Satu tempat untuk alamat backend, token login, dan pemanggilan API.
// Di Vercel isi Environment Variable VITE_API_URL dengan URL backend Render (tanpa "/" di akhir).
export const API_URL = (
    import.meta.env.VITE_API_URL || "https://online-shop-project-gfe0.onrender.com"
).replace(/\/+$/, "");

const TOKEN_KEY = "token";
export const AUTH_EVENT = "auth-change";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT));
}

// Token dianggap valid kalau ada dan belum melewati waktu "exp" di dalam JWT.
export function tokenIsValid(token = getToken()) {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return !payload.exp || payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

/**
 * Memanggil backend dengan fetch.
 * @param {string} path contoh "/api/products"
 * @param {{ method?: string, body?: object, auth?: boolean }} options auth = kirim token JWT
 */
export async function request(path, { method = "GET", body, auth = false } = {}) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth) headers.Authorization = `Bearer ${getToken()}`;

    let response;
    try {
        response = await fetch(API_URL + path, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined
        });
    } catch {
        throw new Error(
            "Tidak bisa terhubung ke server. Server gratis Render butuh sekitar 1 menit untuk aktif, coba lagi sebentar."
        );
    }

    const data = await response.json().catch(() => ({}));

    // Token kedaluwarsa atau tidak valid: logout otomatis
    if (response.status === 401 && auth) clearToken();

    if (!response.ok) {
        const error = new Error(data.error || `Permintaan gagal (${response.status})`);
        error.status = response.status;
        error.details = data.details || {};
        throw error;
    }

    return data;
}
