import { rupiah } from "../utils/format.js";

export default function ProductCard({ product, onClick }) {
    return <div className="product-card">
        <img src={product.image} alt={product.name} className="product-image" loading="lazy" />

        <div className="product-info">
            <h3>{product.name}</h3>
            <p>{rupiah(product.price)}</p>
            <button className="btn" onClick={onClick}>Detail</button>
        </div>

    </div>
}
