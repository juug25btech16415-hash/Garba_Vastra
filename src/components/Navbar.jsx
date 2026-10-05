import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../lib/CartContext'
import { useWishlist } from '../lib/WishlistContext'
import { useAuth } from '../lib/AuthContext'

// Navratri rental announcement banner — visible Oct 9–25
const RENTAL_START = new Date('2026-10-09T00:00:00')
const RENTAL_END   = new Date('2026-10-25T23:59:59')

function AnnouncementBanner() {
  const now = new Date()
  if (now < RENTAL_START || now > RENTAL_END) return null

  return (
    <div
      id="navratri-announcement-banner"
      style={{ background: 'linear-gradient(90deg,#7B1A2E 0%,#A0281C 50%,#7B1A2E 100%)' }}
      className="w-full sticky top-0 z-50 border-b border-amber-200/30 py-2 px-4 text-center"
      role="banner"
      aria-label="Navratri Rental Announcement"
    >
      <p className="text-xs sm:text-sm font-medium text-amber-100 tracking-wide">
        🪔&nbsp;<strong>Exclusive Navratri Rental:</strong>&nbsp;Chaniya Choli rental available exclusively for Jain University students&nbsp;
        <span className="text-amber-200">(Oct 9 – Oct 25)</span>!&nbsp;
        <Link
          to="/?category=Chaniya+Choli&rental=true"
          id="rental-banner-link"
          className="inline-flex items-center gap-1 ml-1 underline underline-offset-2 text-amber-300 hover:text-amber-100 transition-colors font-semibold"
        >
          Shop Rentals&nbsp;→
        </Link>
      </p>
    </div>
  )
}

export default function Navbar() {
  const { totalQty } = useCart()
  const { ids } = useWishlist()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Automatically close mobile menu on route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  return (
    <>
      <AnnouncementBanner />
      <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur border-b border-maroon/10">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          {/* Left container: Back Arrow & Logo */}
          <div className="flex items-center shrink-0 gap-2 sm:gap-4">
            {location.pathname !== '/' && (
              <button
                onClick={() => navigate(-1)}
                className="p-1 text-ink/80 hover:text-maroon transition-colors cursor-pointer"
                aria-label="Go back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 sm:gap-3" aria-label="Garba Vastra home">
              <img
                src="/src/assets/main-logo.png"
                alt="Garba Vastra"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Right navigation */}
          <nav className="flex items-center gap-3 sm:gap-5 text-sm font-medium text-ink/80">
            <Link to="/" className="flex items-center gap-1.5 hover:text-maroon transition-colors" title="Shop">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5 sm:w-4 sm:h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016 2.993 2.993 0 0 0 2.25-1.016 3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
              </svg>
              <span className="hidden sm:block">Shop</span>
            </Link>

            <Link to="/track" className="flex items-center gap-1.5 hover:text-maroon transition-colors" title="Track order">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5 sm:w-4 sm:h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <span className="hidden sm:block">Track order</span>
            </Link>

            <Link to="/wishlist" className="relative flex items-center gap-1.5 hover:text-maroon transition-colors" title="Wishlist">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5 sm:w-4 sm:h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              <span className="hidden sm:block">Wishlist</span>
              {ids.length > 0 && (
                <span className="absolute -top-2 -right-2.5 sm:-right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-maroon text-ivory text-[10px] font-semibold flex items-center justify-center">
                  {ids.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative flex items-center gap-1.5 hover:text-maroon transition-colors" title="Cart">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5 sm:w-4 sm:h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              <span className="hidden sm:block">Cart</span>
              {totalQty > 0 && (
                <span className="absolute -top-2 -right-2.5 sm:-right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-maroon text-ivory text-[10px] font-semibold flex items-center justify-center">
                  {totalQty}
                </span>
              )}
            </Link>

            {user && (
              <>
                {/* Desktop User Badge & Controls */}
                <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-maroon/15 text-xs text-maroon font-semibold">
                  <div className="w-6 h-6 rounded-full bg-maroon/10 text-maroon flex items-center justify-center text-xs uppercase font-bold" title={user.email}>
                    {user.email ? user.email.charAt(0) : 'U'}
                  </div>
                  <span className="max-w-[100px] truncate" title={user.email}>
                    {user.user_metadata?.name || user.email?.split('@')[0]}
                  </span>
                  <Link
                    to="/dashboard"
                    className="ml-1 text-xs text-maroon/80 hover:text-maroon underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="ml-1 text-[10px] sm:text-xs text-maroon/70 hover:text-maroon underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Log out
                  </button>
                </div>

                {/* Mobile Hamburger Button */}
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="sm:hidden p-1 text-ink/80 hover:text-maroon transition-colors cursor-pointer focus:outline-none"
                  aria-label="Toggle user menu"
                  aria-expanded={isMenuOpen}
                >
                  {isMenuOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Mobile Menu Drawer / Dropdown */}
        {user && isMenuOpen && (
          <div className="sm:hidden border-t border-maroon/10 bg-ivory/98 backdrop-blur px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2.5 pb-3 border-b border-maroon/10">
              <div className="w-8 h-8 rounded-full bg-maroon/10 text-maroon flex items-center justify-center text-sm uppercase font-bold">
                {user.email ? user.email.charAt(0) : 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-ink truncate">
                  {user.user_metadata?.name || user.email?.split('@')[0]}
                </span>
                <span className="text-[11px] text-ink/60 truncate">
                  {user.email}
                </span>
              </div>
            </div>
            <div className="pt-2 flex flex-col gap-1 text-sm font-medium">
              <Link
                to="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 py-2 px-1 text-ink hover:text-maroon transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-4 h-4 text-maroon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  signOut()
                }}
                className="flex items-center gap-2 py-2 px-1 text-left text-maroon hover:text-maroon-dark transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                Log out
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
