import { useEffect, useState } from "react";
import { AUTH_EVENT, tokenIsValid } from "../services/api.js";

// Mengembalikan true kalau user sedang login.
// Ikut berubah otomatis saat login, logout, atau token kedaluwarsa.
export default function useAuth() {
    const [loggedIn, setLoggedIn] = useState(() => tokenIsValid());

    useEffect(() => {
        const update = () => setLoggedIn(tokenIsValid());
        window.addEventListener(AUTH_EVENT, update);
        window.addEventListener("storage", update);
        return () => {
            window.removeEventListener(AUTH_EVENT, update);
            window.removeEventListener("storage", update);
        };
    }, []);

    return loggedIn;
}
