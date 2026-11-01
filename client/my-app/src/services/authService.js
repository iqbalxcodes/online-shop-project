// authService.js
import { request, setToken, clearToken } from "./api.js";

export function register(name, email, password) {
    return request("/api/users/register", { method: "POST", body: { name, email, password } });
}

export async function login(email, password) {
    const data = await request("/api/users/login", { method: "POST", body: { email, password } });
    setToken(data.token);
    return data;
}

export function logout() {
    clearToken();
}
