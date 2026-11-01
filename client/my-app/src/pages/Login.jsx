import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { login } from "../services/authService";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Kembali ke halaman yang tadi diminta (misalnya /checkout), kalau ada
    const redirectTo = location.state?.from || "/";

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }

    return (
        <section className="page-section">
            <div className="card auth-card">
                <h1>Login</h1>

                {location.state?.from && <p className="muted">Silakan login dulu untuk melanjutkan.</p>}
                {location.state?.registered && <p className="alert alert-success">Registrasi berhasil. Silakan login.</p>}
                {error && <p className="alert alert-error" role="alert">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <FormField label="Email" htmlFor="email">
                        <input id="email" type="email" value={email} autoComplete="email"
                            onChange={(event) => setEmail(event.target.value)} required />
                    </FormField>

                    <FormField label="Password" htmlFor="password">
                        <input id="password" type="password" value={password} autoComplete="current-password"
                            onChange={(event) => setPassword(event.target.value)} required />
                    </FormField>

                    <button type="submit" className="btn btn-block" disabled={loading}>
                        {loading ? "Memproses..." : "Login"}
                    </button>
                </form>

                <p>
                    Belum punya akun? <Link to="/register">Register</Link>
                </p>
            </div>
        </section>
    );
}

export default Login;
