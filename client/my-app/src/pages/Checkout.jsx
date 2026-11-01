import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { getCart } from "../services/cartService.js";
import { getMe } from "../services/userService.js";
import { createOrder, PAYMENT_LABELS } from "../services/orderService.js";
import { trackEvent } from "../analytics.js";
import { rupiah } from "../utils/format.js";
import "./checkout.css";

const INITIAL_FORM = {
    recipientName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentMethod: "transfer",
    note: ""
};

export default function Checkout() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [form, setForm] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    // Ambil isi keranjang + data profil untuk mengisi form otomatis
    useEffect(() => {
        let active = true;

        Promise.all([getCart(), getMe().catch(() => null)])
            .then(([cart, me]) => {
                if (!active) return;
                setItems(cart);
                if (me) {
                    setForm((f) => ({
                        ...f,
                        recipientName: me.name || "",
                        phone: me.phone || "",
                        address: me.address || ""
                    }));
                }
            })
            .catch((err) => { if (active) setError(err.message); })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, []);

    const total = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((f) => ({ ...f, [name]: value }));
        setFieldErrors((fe) => ({ ...fe, [name]: undefined }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setFieldErrors({});
        setSubmitting(true);

        try {
            const order = await createOrder(form);
            trackEvent("purchase", { transaction_id: order._id, value: order.total, currency: "IDR" });
            navigate(`/orders/${order._id}`, { replace: true, state: { justPlaced: true } });
        } catch (err) {
            setError(err.message);
            setFieldErrors(err.details || {});
            setSubmitting(false);
        }
    }

    if (loading) {
        return <section className="page-section"><p>Memuat checkout...</p></section>;
    }

    if (items.length === 0 && !error) {
        return (
            <section className="page-section">
                <h1>Checkout</h1>
                <p>Keranjang kosong. <Link to="/products">Belanja dulu</Link></p>
            </section>
        );
    }

    return (
        <section className="page-section">
            <Link to="/cart">Kembali ke keranjang</Link>
            <h1>Checkout</h1>

            {error && <p className="alert alert-error" role="alert">{error}</p>}

            <div className="checkout-layout">
                <form className="card checkout-form" onSubmit={handleSubmit}>
                    <h2>Alamat pengiriman</h2>

                    <FormField label="Nama penerima" htmlFor="recipientName" error={fieldErrors.recipientName}>
                        <input id="recipientName" name="recipientName" value={form.recipientName}
                            onChange={handleChange} required minLength={2} maxLength={80} autoComplete="name" />
                    </FormField>

                    <div className="form-row">
                        <FormField label="Nomor HP" htmlFor="phone" error={fieldErrors.phone} hint="Contoh: 081234567890">
                            <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
                                required pattern="(\+62|62|0)8[0-9]{7,12}" autoComplete="tel" />
                        </FormField>

                        <FormField label="Kota" htmlFor="city" error={fieldErrors.city}>
                            <input id="city" name="city" value={form.city} onChange={handleChange}
                                required minLength={2} maxLength={60} autoComplete="address-level2" />
                        </FormField>
                    </div>

                    <FormField label="Alamat lengkap" htmlFor="address" error={fieldErrors.address}
                        hint="Nama jalan, nomor rumah, RT/RW, kelurahan">
                        <textarea id="address" name="address" rows={3} value={form.address} onChange={handleChange}
                            required minLength={10} maxLength={300} autoComplete="street-address" />
                    </FormField>

                    <FormField label="Kode pos" htmlFor="postalCode" error={fieldErrors.postalCode}>
                        <input id="postalCode" name="postalCode" inputMode="numeric" value={form.postalCode}
                            onChange={handleChange} required pattern="[0-9]{5}" maxLength={5}
                            autoComplete="postal-code" className="input-short" />
                    </FormField>

                    <h2>Metode pembayaran</h2>
                    <div className="payment-options" role="radiogroup">
                        {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                            <label key={value}
                                className={`payment-option${form.paymentMethod === value ? " selected" : ""}`}>
                                <input type="radio" name="paymentMethod" value={value}
                                    checked={form.paymentMethod === value} onChange={handleChange} />
                                {label}
                            </label>
                        ))}
                    </div>
                    {fieldErrors.paymentMethod && <small className="field-error">{fieldErrors.paymentMethod}</small>}

                    <FormField label="Catatan untuk penjual (opsional)" htmlFor="note" error={fieldErrors.note}>
                        <textarea id="note" name="note" rows={2} value={form.note} onChange={handleChange}
                            maxLength={300} />
                    </FormField>

                    <button type="submit" className="btn btn-block" disabled={submitting || items.length === 0}>
                        {submitting ? "Memproses pesanan..." : `Buat Pesanan (${rupiah(total)})`}
                    </button>
                </form>

                <aside className="card checkout-summary">
                    <h2>Ringkasan pesanan</h2>
                    <ul className="summary-items">
                        {items.map(({ product, qty }) => (
                            <li key={product._id}>
                                <img src={product.image} alt={product.name} />
                                <div className="summary-info">
                                    <p className="summary-name">{product.name}</p>
                                    <p className="muted">{qty} x {rupiah(product.price)}</p>
                                </div>
                                <strong>{rupiah(product.price * qty)}</strong>
                            </li>
                        ))}
                    </ul>
                    <div className="summary-row">
                        <span>Total ({totalQty} barang)</span>
                        <strong>{rupiah(total)}</strong>
                    </div>
                </aside>
            </div>
        </section>
    );
}
