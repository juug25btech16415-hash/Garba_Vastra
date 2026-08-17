import { Link } from 'react-router-dom'
import { useCart } from '../lib/CartContext'
import { useWishlist } from '../lib/WishlistContext'

export default function Navbar() {
  const { totalQty } = useCart()
  const { ids } = useWishlist()

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur border-b border-maroon/10">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src="/main-logo.png"
            alt="Garba Vastra"
            className="h-12 md:h-16 w-auto object-contain"
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
        </nav>
      </div>
    </header>
  )
}
