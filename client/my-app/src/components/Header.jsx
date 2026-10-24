
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../services/authService";

export default function Header() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <header className="header">
            <strong>Online Shop</strong>

            <nav>
                <Link to="/">Home</Link>{" "}
                <Link to="/products">Katalog Produk</Link>{" "}

                {token ? (
                    <>
                        <Link to="/profile">Profil</Link>{" "}
                        <button onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>{" "}
                        <Link to="/register">Register</Link>
                    </>
                )}
            </nav>
        </header>
    );
}
