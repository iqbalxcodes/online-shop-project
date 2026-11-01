// userService.js
import { request } from "./api.js";

export const getMe = () => request("/api/users/me", { auth: true });
export const updateMe = (data) => request("/api/users/me", { method: "PUT", body: data, auth: true });
export const deleteMe = () => request("/api/users/me", { method: "DELETE", auth: true });
