import { Link } from 'react-router-dom'
import { useWishlist } from '../lib/WishlistContext'

export default function ProductCard({ product }) {
  const stock = product.stock ?? 0
  const isLow = stock > 0 && stock <= 5
  const isOut = stock <= 0
  const { isWishlisted, toggle } = useWishlist()
  const loved = isWishlisted(product.id)

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-teal/5 border border-maroon/10">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggle(product.id)
          }}
          aria-label="Toggle wishlist"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ivory/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          <span className={loved ? 'text-maroon' : 'text-ink/30'}>{loved ? '♥' : '♡'}</span>
        </button>
        {isOut && (
          <div className="absolute inset-0 bg-ink/50 flex items-center justify-center">
            <span className="text-ivory font-display text-lg tracking-wide">Sold out</span>
          </div>
        )}
        {isLow && !isOut && (
          <span className="absolute top-3 left-3 bg-maroon text-ivory text-xs font-semibold px-2.5 py-1 rounded-full">
            Only {stock} left
          </span>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-display text-lg text-ink group-hover:text-maroon transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-ink/60 mt-0.5">{product.category}</p>
        <p className="mt-1 font-medium text-maroon">₹{product.price.toLocaleString('en-IN')}</p>
      </div>
    </Link>
  )
}
