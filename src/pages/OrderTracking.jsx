import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const STATUS_STEPS = ['placed', 'packed', 'shipped', 'out_for_delivery', 'delivered']

export default function OrderTracking() {
  const [orderId, setOrderId] = useState('')
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleTrack(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)

    const { data, error } = await supabase.rpc('get_order_status', {
      p_order_id: orderId.trim(),
      p_phone: phone.trim(),
    })

    setLoading(false)
    if (error || !data || data.length === 0) {
      setError("Couldn't find an order with that ID and phone number — double check both.")
      return
    }
    setResult(data[0])
  }

  const currentStep = result ? STATUS_STEPS.indexOf(result.order_status) : -1

  return (
    <div className="max-w-lg mx-auto px-5 py-16">
      <h1 className="font-display text-3xl text-maroon mb-2">Track your order</h1>
      <p className="text-ink/60 mb-8">Enter your order ID and the phone number you checked out with.</p>

      <form onSubmit={handleTrack} className="space-y-3">
        <input
          placeholder="Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="w-full border border-maroon/20 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-maroon/40"
        />
        <input
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-maroon/20 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-maroon/40"
        />
        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-md bg-maroon text-ivory font-medium hover:bg-maroon-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Looking up…' : 'Track order'}
        </button>
      </form>

      {result && (
        <div className="mt-10 border border-maroon/10 rounded-md p-5">
          <p className="text-sm text-ink/60">Total: ₹{result.total?.toLocaleString('en-IN')}</p>
          <p className="text-sm text-ink/60 mb-5">
            Placed on {new Date(result.created_at).toLocaleDateString('en-IN')}
          </p>

          <div className="flex justify-between relative mb-2">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex-1 text-center relative">
                <div
                  className={`w-3 h-3 rounded-full mx-auto ${
                    i <= currentStep ? 'bg-maroon' : 'bg-maroon/15'
                  }`}
                />
                <p className={`text-[11px] mt-1.5 capitalize ${i <= currentStep ? 'text-maroon font-medium' : 'text-ink/40'}`}>
                  {step.replace(/_/g, ' ')}
                </p>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`absolute top-1.5 left-1/2 w-full h-0.5 ${
                      i < currentStep ? 'bg-maroon' : 'bg-maroon/15'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {result.order_status === 'cancelled' && (
            <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
              This order was cancelled.
            </p>
          )}

          {result.tracking_id && (
            <div className="mt-6 text-sm">
              <p>Tracking ID: <span className="font-mono">{result.tracking_id}</span></p>
              {result.tracking_url && (
                <a href={result.tracking_url} target="_blank" rel="noreferrer" className="text-teal hover:underline">
                  View on courier site →
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
