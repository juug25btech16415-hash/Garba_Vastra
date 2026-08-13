import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../lib/CartContext'

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', city: '', pincode: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function isValid() {
    return form.name && form.phone.length >= 10 && form.address && form.city && form.pincode
  }

  async function handlePay(e) {
    e.preventDefault()
    setError('')
    if (!isValid()) {
      setError('Please fill in all fields with a valid 10-digit phone number.')
      return
    }
    setSubmitting(true)

    try {
      const scriptOk = await loadRazorpayScript()
      if (!scriptOk) throw new Error('Could not load payment gateway. Check your connection.')

      // Ask our backend to create a Razorpay order (server-side, so the
      // amount can't be tampered with from the browser)
      const orderRes = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          customer: form,
          items,
        }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'Could not start payment.')

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Garba Vastra',
        description: `${items.length} item(s)`,
        order_id: orderData.razorpayOrderId,
        prefill: { name: form.name, contact: form.phone, email: form.email },
        theme: { color: '#7A2048' },
        handler: async function (response) {
          // Verify payment server-side, then finalize the order + reduce stock
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              internalOrderId: orderData.internalOrderId,
            }),
          })
          const verifyData = await verifyRes.json()
          if (verifyRes.ok && verifyData.success) {
            clearCart()
            navigate(`/order-confirmed/${orderData.internalOrderId}`)
          } else {
            setError('Payment verification failed. If money was deducted, it will be refunded — contact us with your payment ID: ' + response.razorpay_payment_id)
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      })
      rzp.open()
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return <p className="text-center py-24 text-ink/50">Your cart is empty.</p>
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl text-maroon mb-2">Checkout</h1>
      <p className="text-ink/60 mb-8">Enter your details — no account needed.</p>

      <form onSubmit={handlePay} className="space-y-4">
        <input
          placeholder="Full name"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          className="w-full border border-maroon/20 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-maroon/40"
        />
        <input
          placeholder="Phone number"
          type="tel"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          className="w-full border border-maroon/20 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-maroon/40"
        />
        <input
          placeholder="Email (for order updates)"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          className="w-full border border-maroon/20 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-maroon/40"
        />
        <textarea
          placeholder="Delivery address"
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
          rows={3}
          className="w-full border border-maroon/20 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-maroon/40"
        />
        <div className="flex gap-3">
          <input
            placeholder="City"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            className="flex-1 border border-maroon/20 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-maroon/40"
          />
          <input
            placeholder="Pincode"
            value={form.pincode}
            onChange={(e) => update('pincode', e.target.value)}
            className="w-32 border border-maroon/20 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-maroon/40"
          />
        </div>

        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <span className="text-ink/70">Total</span>
          <span className="font-display text-2xl text-maroon">₹{totalPrice.toLocaleString('en-IN')}</span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-md bg-maroon text-ivory font-medium hover:bg-maroon-dark transition-colors disabled:opacity-50"
        >
          {submitting ? 'Processing…' : 'Pay now'}
        </button>
      </form>
    </div>
  )
}
