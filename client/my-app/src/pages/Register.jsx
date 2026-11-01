import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { register } from "../services/authService";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setFieldErrors({});
        setLoading(true);

        try {
            await register(name, email, password);
            navigate("/login", { state: { registered: true } });
        } catch (err) {
            setError(err.message);
            setFieldErrors(err.details || {});
            setLoading(false);
        }
    }

    return (
        <section className="page-section">
            <div className="card auth-card">
                <h1>Register</h1>

                {error && <p className="alert alert-error" role="alert">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <FormField label="Nama" htmlFor="name" error={fieldErrors.name}>
                        <input id="name" type="text" value={name} autoComplete="name"
                            onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={50} />
                    </FormField>

                    <FormField label="Email" htmlFor="email" error={fieldErrors.email}>
                        <input id="email" type="email" value={email} autoComplete="email"
                            onChange={(event) => setEmail(event.target.value)} required />
                    </FormField>

                    <FormField label="Password" htmlFor="password" error={fieldErrors.password} hint="Minimal 6 karakter">
                        <input id="password" type="password" value={password} autoComplete="new-password"
                            onChange={(event) => setPassword(event.target.value)} required minLength={6} />
                    </FormField>

                    <button type="submit" className="btn btn-block" disabled={loading}>
                        {loading ? "Memproses..." : "Register"}
                    </button>
                </form>

                <p>
                    Sudah punya akun? <Link to="/login">Login</Link>
                </p>
            </div>
        </section>
    );
}

export default Register;
