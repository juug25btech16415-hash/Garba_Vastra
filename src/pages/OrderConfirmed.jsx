import { Link, useParams } from 'react-router-dom'

export default function OrderConfirmed() {
  const { id } = useParams()

  return (
    <div className="max-w-lg mx-auto px-5 py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-teal/10 text-teal flex items-center justify-center mx-auto mb-6 text-2xl">
        ✓
      </div>
      <h1 className="font-display text-3xl text-maroon mb-3">Order placed!</h1>
      <p className="text-ink/70 mb-1">Thank you — your chaniya choli is on its way to being packed.</p>
      <p className="text-sm text-ink/50 mb-8">
        Order ID: <span className="font-mono">{id}</span> — save this to track your order.
      </p>
      <div className="flex gap-3 justify-center">
        <Link to="/track" className="px-6 py-3 rounded-md bg-maroon text-ivory font-medium hover:bg-maroon-dark">
          Track this order
        </Link>
        <Link to="/" className="px-6 py-3 rounded-md border border-maroon/20 font-medium hover:bg-maroon/5">
          Continue shopping
        </Link>
      </div>
    </div>
  )
}
