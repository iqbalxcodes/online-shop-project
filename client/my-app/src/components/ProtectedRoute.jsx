import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";

// Halaman di dalam komponen ini hanya bisa dibuka oleh user yang sudah login
// dan tokennya belum kedaluwarsa. Setelah login, user dikembalikan ke halaman tujuan.
export default function ProtectedRoute({ children }) {
    const loggedIn = useAuth();
    const location = useLocation();

    if (!loggedIn) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return children;
}
