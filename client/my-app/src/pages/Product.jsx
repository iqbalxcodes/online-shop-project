import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard.jsx'
import { getProducts } from '../services/productService.js'
import './products.css'
import { Link, useNavigate } from 'react-router-dom'


export default function Products() {
    
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {

        let active = true

        getProducts()
            .then(data => {if (active) setProducts(data)})
            .catch(err => {if (active) setError (err.message)})
            .finally(() => {if (active) setLoading(false)})

        return () => {
            active = false
        }

    }, [])

    if (loading) return <p className='page-section'>Memuat Produk ...</p>
    if (error) return <p className='page-section' role='alert'>{error}</p>

    return <section className="page-section">
        <Link to="/">Kembali ke halaman utama</Link>
        <div className="toolbar">
            <h2>Semua Produk</h2>
            <span>{products.length} produk</span>
        </div>

        {products.length === 0 && <p>Belum ada produk.</p>}

        <div className="products-grid">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product = {product}
                    onClick={() => navigate(`/products/${product._id}`)}
                />
            ))}
        </div>
    </section>
}