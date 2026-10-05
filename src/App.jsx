import { useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Wishlist from './pages/Wishlist'
import Checkout from './pages/Checkout'
import OrderConfirmed from './pages/OrderConfirmed'
import OrderTracking from './pages/OrderTracking'
import PrivacyPolicy from './pages/PrivacyPolicy'
import AdminLogin from './pages/AdminLogin'
import Admin from './pages/Admin'
import CustomerDashboard from './pages/CustomerDashboard'
import Rentals from './pages/Rentals'
import ProtectedRoute from './components/ProtectedRoute'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      {/* Sitewide Navratri Rental Announcement Banner */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 9999,
          backgroundColor: '#fef3c7',
          borderBottom: '1px solid #fcd34d',
          color: '#7c0a02',
          fontSize: '0.875rem',
          padding: '0.5rem 1rem',
          textAlign: 'center',
          fontWeight: 500,
          letterSpacing: '0.01em',
        }}
      >
        <Link
          to="/rentals"
          style={{
            color: 'inherit',
            textDecoration: 'none',
            display: 'inline-block',
            borderRadius: '4px',
            padding: '2px 6px',
            transition: 'background-color 0.15s ease, text-decoration 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fde68a'
            e.currentTarget.style.textDecoration = 'underline'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.textDecoration = 'none'
          }}
        >
          🪔 Exclusive Navratri Rental: Available ONLY for Jain University students (Oct 9 – Oct 25). Click here to book!
        </Link>
      </div>
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmed/:id" element={<OrderConfirmed />} />
          <Route path="/track" element={<OrderTracking />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
