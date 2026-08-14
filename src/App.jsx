import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmed from './pages/OrderConfirmed';
import OrderTracking from './pages/OrderTracking';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import Wishlist from './pages/Wishlist';

// 1. THIS IS THE NEW IMPORT LINE
import Login from './pages/Login'; 

import { CartProvider } from './lib/CartContext';
import { WishlistProvider } from './lib/WishlistContext'; 

function App() {
  return (
    <CartProvider>
      <WishlistProvider> 
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmed/:id" element={<OrderConfirmed />} />
              <Route path="/track" element={<OrderTracking />} />
              <Route path="/wishlist" element={<Wishlist />} /> 
              
              {/* 2. THIS IS THE NEW ROUTE LINE */}
              <Route path="/login" element={<Login />} /> 
              
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;
