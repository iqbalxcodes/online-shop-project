import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCart, updateQty, removeFromCart } from "../services/cartService.js";
import "./cart.css";

export default function Cart() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getCart()
            .then(setItems)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const act = (fn) => fn().then(setItems).catch((err) => setError(err.message));
    const total = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);

    if (loading) {
        return (
            <section className="page-section">
                <p>Memuat keranjang</p>
            </section>
        );
    }

    return (
        <section className="page-section">
            <h1>Keranjang</h1>

            {error && <p role="alert">{error}</p>}

            {items.length === 0 ? (
                <p>
                    Keranjang kosong. <Link to="/products">Belanja dulu</Link>
                </p>
            ) : (
                <>
                    {items.map(({ product, qty }) => (
                        <div className="cart-item" key={product._id}>
                            <img src={product.image} alt={product.name} />

                            <div className="cart-item-info">
                                <Link to={`/products/${product._id}`}>{product.name}</Link>
                                <p>Rp {product.price.toLocaleString("id-ID")}</p>
                            </div>

                            <div className="cart-item-qty">
                                <button
                                    className="btn"
                                    disabled={qty <= 1}
                                    onClick={() => act(() => updateQty(product._id, qty - 1))}
                                >
                                    -
                                </button>
                                <span>{qty}</span>
                                <button
                                    className="btn"
                                    disabled={qty >= product.stock}
                                    onClick={() => act(() => updateQty(product._id, qty + 1))}
                                >
                                    +
                                </button>
                            </div>

                            <button className="btn" onClick={() => act(() => removeFromCart(product._id))}>
                                Hapus
                            </button>
                        </div>
                    ))}

                    <p className="cart-total">Total: Rp {total.toLocaleString("id-ID")}</p>
                </>
            )}
        </section>
    );
}