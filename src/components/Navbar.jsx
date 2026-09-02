import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../lib/CartContext'
import { useWishlist } from '../lib/WishlistContext'
import { useAuth } from '../lib/AuthContext'

export default function Navbar() {
  const { totalQty } = useCart()
  const { ids } = useWishlist()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur border-b border-maroon/10">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        {/* Left container: Back Arrow & Logo */}
        <div className="flex items-center shrink-0 gap-3 sm:gap-4">
          {location.pathname !== '/' && (
            <button
              onClick={() => navigate(-1)}
              className="p-1 text-ink/80 hover:text-maroon transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
          )}

          <Link to="/" className="flex items-center">
            <img
              src="/main-logo.png"
              alt="Garba Vastra"
              className="h-14 sm:h-16 md:h-18 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Right container: Navigation & Actions */}
        <nav className="flex items-center justify-end gap-3 sm:gap-6 ml-auto text-xs sm:text-sm font-medium text-ink/80 shrink-0">
          <Link to="/" className="hover:text-maroon transition-colors">
            Shop
          </Link>
          <Link to="/track" className="hover:text-maroon transition-colors">
            Track order
          </Link>
          <Link to="/wishlist" className="relative flex items-center gap-2 hover:text-maroon transition-colors">
            Wishlist
            {ids.length > 0 && (
              <span className="absolute -top-2 -right-4 min-w-[18px] h-[18px] px-1 rounded-full bg-maroon text-ivory text-[10px] font-semibold flex items-center justify-center">
                {ids.length}
              </span>
            )}
          </Link>
          <Link to="/cart" className="relative flex items-center gap-2 hover:text-maroon transition-colors">
            Cart
            {totalQty > 0 && (
              <span className="absolute -top-2 -right-4 min-w-[18px] h-[18px] px-1 rounded-full bg-maroon text-ivory text-[10px] font-semibold flex items-center justify-center">
                {totalQty}
              </span>
            )}
          </Link>
          {user && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-maroon/15 text-xs text-maroon font-semibold">
              <div className="w-6 h-6 rounded-full bg-maroon/10 text-maroon flex items-center justify-center text-xs uppercase font-bold" title={user.email}>
                {user.email ? user.email.charAt(0) : 'U'}
              </div>
              <span className="hidden sm:inline-block max-w-[100px] truncate" title={user.email}>
                {user.user_metadata?.name || user.email?.split('@')[0]}
              </span>
              <button 
                onClick={() => signOut()}
                className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-maroon/70 hover:text-maroon underline underline-offset-2 transition-colors cursor-pointer"
              >
                Log out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
