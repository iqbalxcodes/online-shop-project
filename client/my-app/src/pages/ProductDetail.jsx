import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProductById } from '../services/productService.js'
import { addToCart } from '../services/cartService.js'
import './productDetail.css'

export default function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [notice, setNotice] = useState("")

    useEffect(() => {
        let active = true

        getProductById(id)
            .then(data => {
                if (active) {
                    if (data) {
                        setProduct(data)
                    } else {
                        setError("Produk tidak ditemukan")
                    }
                }
            })
            .catch(err => {
                if (active) {
                    setError(err.message)
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false)
                }
            })

        return () => {
            active = false
        }
    }, [id])

    async function handleAdd() {
        if (!localStorage.getItem("token")) {
            navigate("/login")
            return
        }

        try {
            await addToCart(product._id)
            setNotice("Ditambahkan ke keranjang")
        } catch (err) {
            setNotice(err.message)
        }
    }

    if (loading) {
        return (
            <section className="page-section">
                <p>Memuat detail produk</p>
            </section>
        )
    }

    if (error) {
        return (
            <section className="page-section">
                <Link to="/products">Kembali ke produk</Link>
                <p role="alert">{error}</p>
            </section>
        )
    }

    return (
        <section className="page-section product-detail">
            <Link to="/products">Kembali</Link>

            <div className="product-detail-content">
                <div className="product-detail-image">
                    <img
                        src={product.image}
                        alt={product.name}
                    />
                </div>

                <div className="product-detail-info">
                    <h1>{product.name}</h1>

                    <p className="product-detail-price">
                        Rp {product.price.toLocaleString("id-ID")}
                    </p>

                    <p className="product-detail-stock">
                        Stok: {product.stock}
                    </p>

                    <div className="product-detail-description">
                        <h3>Deskripsi</h3>
                        <p>{product.description}</p>
                    </div>

                    <button
                        type="button"
                        disabled={product.stock <= 0}
                        onClick={handleAdd}
                    >
                        Tambah ke Keranjang
                    </button>

                    <p role="status">{notice}</p>
                </div>
            </div>
        </section>
    )
}