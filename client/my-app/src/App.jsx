// App.jsx
import { useEffect } from 'react'
import { Routes, Route, BrowserRouter, useLocation } from 'react-router-dom'
import ReactGA from 'react-ga4'
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

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

if (measurementId) {
  ReactGA.initialize(measurementId)
}

function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    if (measurementId) {
      ReactGA.send({
        hitType: 'pageview',
        page: location.pathname + location.search,
      })
    }
  }, [location])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <AnalyticsTracker />

      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
      </Routes>

      <Footer />
    </BrowserRouter>
  )
}

export default App
