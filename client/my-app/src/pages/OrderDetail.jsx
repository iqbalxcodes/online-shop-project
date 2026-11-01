import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { cancelOrder, getOrder, PAYMENT_LABELS, STATUS_LABELS } from "../services/orderService.js";
import { formatDate, rupiah, shortId } from "../utils/format.js";
import "./checkout.css";

export default function OrderDetail() {
    const { id } = useParams();
    const location = useLocation();
    const justPlaced = location.state?.justPlaced;

    const [order, setOrder] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let active = true;
        getOrder(id)
            .then((data) => { if (active) setOrder(data); })
            .catch((err) => { if (active) setError(err.message); });
        return () => { active = false; };
    }, [id]);

    async function handleCancel() {
        setBusy(true);
        setError("");
        try {
            setOrder(await cancelOrder(id));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    if (!order) {
        return (
            <section className="page-section">
                {error
                    ? <><p className="alert alert-error" role="alert">{error}</p><Link to="/profile">Lihat riwayat pesanan</Link></>
                    : <p>Memuat pesanan...</p>}
            </section>
        );
    }

    return (
        <section className="page-section">
            {justPlaced && order.status === "pending" && (
                <p className="alert alert-success" role="status">
                    Pesanan berhasil dibuat. Simpan nomor pesanan <strong>#{shortId(order._id)}</strong> untuk konfirmasi pembayaran.
                </p>
            )}

            <div className="order-header">
                <h1>Pesanan #{shortId(order._id)}</h1>
                <span className={`status status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
            </div>
            <p className="muted">Dibuat {formatDate(order.createdAt)}</p>

            {error && <p className="alert alert-error" role="alert">{error}</p>}

            <div className="order-grid">
                <div className="card">
                    <h2>Produk</h2>
                    <ul className="summary-items">
                        {order.items.map((item) => (
                            <li key={item.product}>
                                <img src={item.image} alt={item.name} />
                                <div className="summary-info">
                                    <p className="summary-name">{item.name}</p>
                                    <p className="muted">{item.qty} x {rupiah(item.price)}</p>
                                </div>
                                <strong>{rupiah(item.price * item.qty)}</strong>
                            </li>
                        ))}
                    </ul>
                    <div className="summary-row">
                        <span>Total</span>
                        <strong>{rupiah(order.total)}</strong>
                    </div>
                </div>

                <div className="card">
                    <h2>Pengiriman</h2>
                    <p>
                        <strong>{order.shipping.recipientName}</strong><br />
                        {order.shipping.phone}<br />
                        {order.shipping.address}<br />
                        {order.shipping.city} {order.shipping.postalCode}
                    </p>

                    <h2>Pembayaran</h2>
                    <p>{PAYMENT_LABELS[order.paymentMethod]}</p>

                    {order.note && (
                        <>
                            <h2>Catatan</h2>
                            <p>{order.note}</p>
                        </>
                    )}
                </div>
            </div>

            <div className="order-actions">
                <Link className="btn" to="/products">Belanja lagi</Link>
                <Link className="btn btn-outline" to="/profile">Riwayat pesanan</Link>
                {order.status === "pending" && (
                    <button className="btn btn-danger" onClick={handleCancel} disabled={busy}>
                        {busy ? "Membatalkan..." : "Batalkan pesanan"}
                    </button>
                )}
            </div>
        </section>
    );
}
