import { Link, NavLink, useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import useAuth from "../hooks/useAuth.js";

export default function Header() {
    const navigate = useNavigate();
    const loggedIn = useAuth();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <header className="header">
            <Link to="/" className="brand">Online Shop</Link>

            <nav className="nav">
                <NavLink to="/" end>Home</NavLink>
                <NavLink to="/products">Katalog Produk</NavLink>

                {loggedIn ? (
                    <>
                        <NavLink to="/cart">Keranjang</NavLink>
                        <NavLink to="/profile">Profil</NavLink>
                        <button className="btn btn-small" onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <>
                        <NavLink to="/login">Login</NavLink>
                        <NavLink to="/register">Register</NavLink>
                    </>
                )}
            </nav>
        </header>
    );
}
