import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../lib/CartContext'
import { useAuth } from '../lib/AuthContext'
import { calcShipping } from '../lib/shipping'

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

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  )
}

const STORAGE_KEY = 'checkout_form_data'

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart()
  const { user, signInWithGoogle, signOut, updateUserProfile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const shipping = calcShipping(totalPrice)
  const grandTotal = totalPrice + shipping

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '', pincode: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState('')
  const [authNotice, setAuthNotice] = useState('')

  useEffect(() => {
    try {
      const savedForm = localStorage.getItem(STORAGE_KEY)
      if (savedForm) {
        const parsed = JSON.parse(savedForm)
        if (parsed && typeof parsed === 'object') setForm((prev) => ({ ...prev, ...parsed }))
      }
    } catch (err) {
      console.error('[Checkout] Failed to load saved form data:', err)
    }
  }, [])

  useEffect(() => {
    if (user) {
      const meta = user.user_metadata || {}
      setForm((prev) => {
        const next = {
          name: prev.name || meta.name || '',
          phone: prev.phone || meta.phone || '',
          email: user.email || prev.email || '',
          address: prev.address || meta.address || '',
          city: prev.city || meta.city || '',
          pincode: prev.pincode || meta.pincode || '',
        }
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch (err) {}
        return next
      })
      setAuthNotice(meta.address || meta.phone ? 'Saved shipping address applied.' : 'Signed in with Google. Complete your delivery details below.')
    } else {
      setAuthNotice('')
    }
  }, [user])

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch (err) {}
      return next
    })
    // Clear error for this field when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  function validateForm() {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Full name is required.'
    if (!/^\d{10}$/.test(form.phone)) errors.phone = 'Phone number must be exactly 10 digits.'
    if (!form.address.trim()) errors.address = 'Delivery address is required.'
    if (!form.city.trim()) errors.city = 'City is required.'
    if (!/^\d{6}$/.test(form.pincode)) errors.pincode = 'Pincode must be exactly 6 digits.'
    return errors
  }

  async function handleGoogleLogin() {
    setError(''); setOauthLoading(true)
    try { await signInWithGoogle() } 
    catch (err) { setError(err.message || 'Google auth failed.'); setOauthLoading(false) }
  }

  async function handleSignOut() {
    try {
      await signOut()
      setForm({ name: '', phone: '', email: '', address: '', city: '', pincode: '' })
      try { localStorage.removeItem(STORAGE_KEY) } catch (err) {}
      setAuthNotice('')
    } catch (err) { console.error('[Checkout] Sign out error:', err) }
  }

  async function handlePay(e) {
    e.preventDefault()
    setError('')
    const errors = validateForm()
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Please fix the errors in the form before proceeding.')
      return
    }
    
    setSubmitting(true)

    try {
      const scriptOk = await loadRazorpayScript()
      if (!scriptOk) throw new Error('Could not load payment gateway. Check your connection.')

      const orderRes = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalPrice, customer: form, items }),
      })
      const orderData = await orderRes.json().catch(() => ({ error: `Server returned status ${orderRes.status}` }))
      if (!orderRes.ok) throw new Error(orderData.error || `Could not start payment.`)

      const rzpOrderId = orderData.razorpayOrderId || orderData.order_id
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID
      if (!razorpayKey) throw new Error('Razorpay Key ID is not configured.')

      const rzp = new window.Razorpay({
        key: razorpayKey, amount: orderData.amount, currency: orderData.currency || 'INR',
        name: 'Garba Vastra', description: `${items.length} item(s)`, order_id: rzpOrderId,
        prefill: { name: form.name, contact: form.phone, email: form.email },
        theme: { color: '#7A2048' },
        handler: async function (response) {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                internalOrderId: orderData.internalOrderId,
              }),
            })
            const verifyData = await verifyRes.json().catch(() => ({ success: false }))
            if (verifyRes.ok && verifyData.success) {
              if (user) await updateUserProfile({ name: form.name, phone: form.phone, address: form.address, city: form.city, pincode: form.pincode }).catch(() => {})
              try { localStorage.removeItem(STORAGE_KEY) } catch (err) {}
              clearCart()
              navigate(orderData.internalOrderId ? `/order-confirmed/${orderData.internalOrderId}` : '/shop')
            } else {
              setError(verifyData.error || 'Payment verification failed. Payment ID: ' + response.razorpay_payment_id)
              setSubmitting(false)
            }
          } catch (err) {
            setError('Verification request failed. Check your network.'); setSubmitting(false)
          }
        },
        modal: { ondismiss: () => { setSubmitting(false); setError('Payment cancelled by user.') } },
      })
      rzp.on('payment.failed', function (response) {
        setSubmitting(false)
        setError(`Payment failed: ${response?.error?.description || 'Could not be processed.'}`)
      })
      rzp.open()
    } catch (err) {
      setError(err.message); setSubmitting(false)
    }
  }

  if (items.length === 0) return <p className="text-center py-24 text-ink/50">Your cart is empty.</p>

  return (
    <div className="max-w-xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl text-maroon mb-2">Checkout</h1>
      <p className="text-ink/60 mb-6">{user ? 'Confirm your shipping and payment details.' : 'Fast checkout with Google or continue as guest.'}</p>

      {!authLoading && (
        <div className="mb-6">
          {!user ? (
            <div className="bg-white/80 border border-maroon/15 rounded-lg p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-sm text-ink">Have a Google Account?</h2>
                  <p className="text-xs text-ink/60 mt-0.5">Save your delivery details for 1-click express checkout next time.</p>
                </div>
                <button type="button" onClick={handleGoogleLogin} disabled={oauthLoading} className="flex items-center justify-center gap-2.5 bg-white border border-gray-300 text-ink text-sm font-medium px-4 py-2.5 rounded-md shadow-xs cursor-pointer">
                  <GoogleIcon /> <span>{oauthLoading ? 'Connecting…' : 'Continue with Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/90 border border-teal/20 rounded-lg p-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold text-sm">
                  {user.email ? user.email.charAt(0).toUpperCase() : '✓'}
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{user.email}</p>
                </div>
              </div>
              <button type="button" onClick={handleSignOut} className="text-xs text-maroon font-medium underline">Sign out</button>
            </div>
          )}
        </div>
      )}

      {authNotice && <div className="mb-4 text-xs text-teal bg-teal/5 border border-teal/20 rounded-md px-3.5 py-2">ℹ️ {authNotice}</div>}

      <form onSubmit={handlePay} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Full Name</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} className={`w-full border bg-white/90 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 ${fieldErrors.name ? 'border-red-500 focus:ring-red-400' : 'border-maroon/20 focus:ring-maroon/40 focus:border-maroon'}`} />
          {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Phone Number (10 digits)</label>
          <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className={`w-full border bg-white/90 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 ${fieldErrors.phone ? 'border-red-500 focus:ring-red-400' : 'border-maroon/20 focus:ring-maroon/40 focus:border-maroon'}`} />
          {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Email Address (Optional)</label>
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full border border-maroon/20 bg-white/90 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-maroon/40 focus:border-maroon" />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Delivery Address</label>
          <textarea rows={3} value={form.address} onChange={(e) => update('address', e.target.value)} className={`w-full resize-none border bg-white/90 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 ${fieldErrors.address ? 'border-red-500 focus:ring-red-400' : 'border-maroon/20 focus:ring-maroon/40 focus:border-maroon'}`} />
          {fieldErrors.address && <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>}
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-ink/70 mb-1">City</label>
            <input value={form.city} onChange={(e) => update('city', e.target.value)} className={`w-full border bg-white/90 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 ${fieldErrors.city ? 'border-red-500 focus:ring-red-400' : 'border-maroon/20 focus:ring-maroon/40 focus:border-maroon'}`} />
            {fieldErrors.city && <p className="text-red-500 text-xs mt-1">{fieldErrors.city}</p>}
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-ink/70 mb-1">Pincode</label>
            <input value={form.pincode} onChange={(e) => update('pincode', e.target.value)} className={`w-full border bg-white/90 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 ${fieldErrors.pincode ? 'border-red-500 focus:ring-red-400' : 'border-maroon/20 focus:ring-maroon/40 focus:border-maroon'}`} />
            {fieldErrors.pincode && <p className="text-red-500 text-xs mt-1">{fieldErrors.pincode}</p>}
          </div>
        </div>

        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}

        <div className="space-y-1.5 pt-4 border-t border-maroon/10">
          <div className="flex items-center justify-between text-sm text-ink/60"><span>Subtotal</span><span>₹{totalPrice.toLocaleString('en-IN')}</span></div>
          <div className="flex items-center justify-between text-sm text-ink/60"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
          <div className="flex items-center justify-between pt-1"><span className="text-ink/70 font-medium">Total Payable</span><span className="font-display text-2xl text-maroon">₹{grandTotal.toLocaleString('en-IN')}</span></div>
        </div>

        <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-md bg-maroon text-ivory font-medium hover:bg-maroon-dark transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
          {submitting ? 'Processing Order…' : 'Proceed to Payment'}
        </button>
      </form>
    </div>
  )
}
