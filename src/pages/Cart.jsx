import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../lib/CartContext'
import { SHIPPING_FEE, FREE_SHIPPING_THRESHOLD, calcShipping } from '../lib/shipping'

export default function Cart() {
  const { items, updateQty, removeItem, totalPrice } = useCart()
  const navigate = useNavigate()
  const shipping = calcShipping(totalPrice)

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <h1 className="font-display text-3xl text-maroon mb-3">Your cart is empty</h1>
        <p className="text-ink/60 mb-6">Add a piece from the shop to see it here.</p>
        <Link to="/" className="inline-block px-6 py-3 rounded-md bg-maroon text-ivory font-medium hover:bg-maroon-dark">
          Browse the shop
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl text-maroon mb-8">Your cart</h1>

      <div className="divide-y divide-maroon/10">
        {items.map((item) => (
          <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 py-5">
            <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded-md bg-teal/5" />
            <div className="flex-1">
              <p className="font-display text-lg">{item.name}</p>
              <p className="text-sm text-ink/60">
                {item.size && `Size ${item.size}`} {item.color && `· ${item.color}`}
              </p>
              <p className="text-maroon font-medium mt-1">₹{item.price.toLocaleString('en-IN')}</p>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center border border-maroon/20 rounded-md">
                  <button
                    className="px-3 py-1 text-lg"
                    onClick={() => updateQty(item.productId, item.size, item.color, item.qty - 1)}
                  >
                    −
                  </button>
                  <span className="px-3">{item.qty}</span>
                  <button
                    className="px-3 py-1 text-lg"
                    onClick={() => updateQty(item.productId, item.size, item.color, item.qty + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  className="text-sm text-ink/50 hover:text-maroon"
                  onClick={() => removeItem(item.productId, item.size, item.color)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-maroon/10 pt-6 space-y-2">
        <div className="flex items-center justify-between text-sm text-ink/70">
          <span>Subtotal</span>
          <span>₹{totalPrice.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-ink/70">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
        </div>
        {shipping > 0 && (
          <p className="text-xs text-ink/45">
            Add ₹{(FREE_SHIPPING_THRESHOLD - totalPrice).toLocaleString('en-IN')} more for free shipping
          </p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-maroon/10">
          <span className="text-ink/70">Total</span>
          <span className="font-display text-2xl text-maroon">
            ₹{(totalPrice + shipping).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <button
        onClick={() => navigate('/checkout')}
        className="mt-6 w-full py-3.5 rounded-md bg-maroon text-ivory font-medium hover:bg-maroon-dark transition-colors"
      >
        Proceed to checkout
      </button>
    </div>
  )
}
