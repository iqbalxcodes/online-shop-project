export default function ProductCard({product, onClick}) {
    return <div className="product-card">
        <img src={product.image} alt={product.title} className="product-image" />

        <div className="product-info">
            <h3>{product.name}</h3>
            <p>Rp {product.price}</p>
            <button className="btn" onClick={onClick}>Detail</button>
        </div>

    </div>
}