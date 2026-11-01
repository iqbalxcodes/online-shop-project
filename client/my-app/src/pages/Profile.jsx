import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { deleteMe, getMe, updateMe } from "../services/userService.js";
import { getOrders, STATUS_LABELS } from "../services/orderService.js";
import { clearToken } from "../services/api.js";
import { formatDate, rupiah, shortId } from "../utils/format.js";
import "./checkout.css";

const FIELDS = ["name", "email", "phone", "address"];

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", password: "" });
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        let active = true;
        Promise.all([getMe(), getOrders()])
            .then(([me, myOrders]) => {
                if (!active) return;
                setUser(me);
                setForm({ name: me.name, email: me.email, phone: me.phone || "", address: me.address || "", password: "" });
                setOrders(myOrders);
            })
            .catch((err) => { if (active) setError(err.message); });
        return () => { active = false; };
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((f) => ({ ...f, [name]: value }));
        setFieldErrors((fe) => ({ ...fe, [name]: undefined }));
        setMessage("");
    }

    async function handleSave(event) {
        event.preventDefault();
        setError("");
        setMessage("");
        setFieldErrors({});

        // Hanya kirim field yang berubah
        const changes = {};
        for (const field of FIELDS) {
            if (form[field].trim() !== (user[field] || "")) changes[field] = form[field].trim();
        }
        if (form.password) changes.password = form.password;

        if (Object.keys(changes).length === 0) {
            setMessage("Tidak ada perubahan.");
            return;
        }

        setSaving(true);
        try {
            const updated = await updateMe(changes);
            setUser(updated);
            setForm((f) => ({ ...f, password: "" }));
            setMessage("Profil berhasil disimpan.");
        } catch (err) {
            setError(err.message);
            setFieldErrors(err.details || {});
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        try {
            await deleteMe();
            clearToken();
            navigate("/", { replace: true });
        } catch (err) {
            setError(err.message);
            setConfirmDelete(false);
        }
    }

    if (!user) {
        return (
            <section className="page-section">
                <h1>Profil Pengguna</h1>
                {error ? <p className="alert alert-error" role="alert">{error}</p> : <p>Memuat profil...</p>}
            </section>
        );
    }

    return (
        <section className="page-section">
            <h1>Profil Pengguna</h1>

            {error && <p className="alert alert-error" role="alert">{error}</p>}
            {message && <p className="alert alert-success" role="status">{message}</p>}

            <div className="profile-layout">
                <form className="card" onSubmit={handleSave}>
                    <h2>Data akun</h2>

                    <FormField label="Nama" htmlFor="name" error={fieldErrors.name}>
                        <input id="name" name="name" value={form.name} onChange={handleChange} required minLength={2} />
                    </FormField>
                    <FormField label="Email" htmlFor="email" error={fieldErrors.email}>
                        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
                    </FormField>
                    <FormField label="Nomor HP" htmlFor="phone" error={fieldErrors.phone} hint="Dipakai otomatis saat checkout">
                        <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
                            pattern="(\+62|62|0)8[0-9]{7,12}" />
                    </FormField>
                    <FormField label="Alamat" htmlFor="address" error={fieldErrors.address} hint="Dipakai otomatis saat checkout">
                        <textarea id="address" name="address" rows={2} value={form.address} onChange={handleChange} maxLength={300} />
                    </FormField>
                    <FormField label="Password baru" htmlFor="password" error={fieldErrors.password}
                        hint="Kosongkan kalau tidak ingin mengganti password">
                        <input id="password" name="password" type="password" value={form.password}
                            onChange={handleChange} minLength={6} autoComplete="new-password" />
                    </FormField>

                    <button type="submit" className="btn" disabled={saving}>
                        {saving ? "Menyimpan..." : "Simpan perubahan"}
                    </button>

                    <div className="danger-zone">
                        {confirmDelete ? (
                            <>
                                <p>Akun dan keranjang akan dihapus permanen. Lanjutkan?</p>
                                <button type="button" className="btn btn-danger" onClick={handleDelete}>Ya, hapus akun</button>{" "}
                                <button type="button" className="btn btn-outline" onClick={() => setConfirmDelete(false)}>Batal</button>
                            </>
                        ) : (
                            <button type="button" className="btn btn-outline btn-danger-text" onClick={() => setConfirmDelete(true)}>
                                Hapus akun
                            </button>
                        )}
                    </div>
                </form>

                <div className="card">
                    <h2>Riwayat pesanan</h2>
                    {orders.length === 0 ? (
                        <p>Belum ada pesanan. <Link to="/products">Mulai belanja</Link></p>
                    ) : (
                        <ul className="order-list">
                            {orders.map((order) => (
                                <li key={order._id}>
                                    <div>
                                        <Link to={`/orders/${order._id}`}><strong>#{shortId(order._id)}</strong></Link>
                                        <p className="muted">{formatDate(order.createdAt)} · {order.items.length} produk</p>
                                    </div>
                                    <div className="order-list-right">
                                        <strong>{rupiah(order.total)}</strong>
                                        <span className={`status status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
}
