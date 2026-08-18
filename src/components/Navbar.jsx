import { Link } from 'react-router-dom'
import { useCart } from '../lib/CartContext'
import { useWishlist } from '../lib/WishlistContext'
import { useAuth } from '../lib/AuthContext'

export default function Navbar() {
  const { totalQty } = useCart()
  const { ids } = useWishlist()
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur border-b border-maroon/10">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src="/main-logo.png"
            alt="Garba Vastra"
            className="h-16 md:h-18 w-auto object-contain"
          />
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-ink/80">
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
            <div
              className="flex items-center gap-1.5 pl-2 border-l border-maroon/15 text-xs text-maroon font-semibold"
              title={user.email}
            >
              <div className="w-6 h-6 rounded-full bg-maroon/10 text-maroon flex items-center justify-center text-xs uppercase font-bold">
                {user.email ? user.email.charAt(0) : 'U'}
              </div>
              <span className="hidden sm:inline-block max-w-[100px] truncate">
                {user.user_metadata?.name || user.email?.split('@')[0]}
              </span>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
