import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../lib/CartContext'

export default function Cart() {
  const { items, updateQty, removeItem, totalPrice } = useCart()
  const navigate = useNavigate()

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

      <div className="mt-8 flex items-center justify-between border-t border-maroon/10 pt-6">
        <span className="text-ink/70">Subtotal</span>
        <span className="font-display text-2xl text-maroon">₹{totalPrice.toLocaleString('en-IN')}</span>
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
