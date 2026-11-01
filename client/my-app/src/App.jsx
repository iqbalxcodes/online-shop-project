// App.jsx
import { useEffect } from 'react'
import { Routes, Route, BrowserRouter, Link, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import './App.css'
import Products from './pages/Product.jsx'
import Home from './pages/Home.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Profile from './pages/Profile.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderDetail from './pages/OrderDetail.jsx'
import { trackPageview } from './analytics.js'

// Kirim pageview ke Google Analytics setiap kali halaman berganti
function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    trackPageview(location.pathname + location.search)
  }, [location])

  return null
}

function NotFound() {
  return (
    <section className="page-section">
      <h1>Halaman tidak ditemukan</h1>
      <Link to="/">Kembali ke beranda</Link>
    </section>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AnalyticsTracker />

      <Header />

      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  )
}

export default App
