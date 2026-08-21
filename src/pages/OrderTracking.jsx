import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const PROGRESS_STAGES = [
  { key: 'placed', label: 'Order Placed', matchers: ['placed', 'confirmed', 'order placed', 'created', 'processing'] },
  { key: 'picked', label: 'Order Picked', matchers: ['picked', 'pickup', 'packed', 'manifested'] },
  { key: 'in_transit', label: 'In Transit', matchers: ['in transit', 'shipped', 'reached at', 'transit', 'dispatched'] },
  { key: 'out_for_delivery', label: 'Out for Delivery', matchers: ['out for delivery', 'reaching today', 'out_for_delivery'] },
  { key: 'delivered', label: 'Delivered', matchers: ['delivered', 'completed'] },
]

function getStageIndex(currentStatus = '') {
  if (!currentStatus) return 0
  const normalized = currentStatus.toLowerCase()
  for (let i = PROGRESS_STAGES.length - 1; i >= 0; i--) {
    if (PROGRESS_STAGES[i].matchers.some((m) => normalized.includes(m))) {
      return i
    }
  }
  return 1
}

function formatTimelineDate(dateStr) {
  if (!dateStr) return 'Recent'
  try {
    const formattedStr = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr
    const parsedDate = new Date(formattedStr)
    if (isNaN(parsedDate.getTime())) {
      return String(dateStr)
    }
    return parsedDate.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(dateStr)
  }
}

export default function OrderTracking() {
  const [searchParams] = useSearchParams()
  const [orderId, setOrderId] = useState('')
  const [phone, setPhone] = useState('')
  const [trackingData, setTrackingData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Pre-fill Order ID from URL parameter (e.g. /track?id=... or /track?order_id=...)
  useEffect(() => {
    const initialId = searchParams.get('id') || searchParams.get('order_id')
    if (initialId) {
      setOrderId(initialId)
    }
  }, [searchParams])

  async function handleTrack(e) {
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    setError('')
    setTrackingData(null)

    const trimmedOrderId = orderId.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedOrderId) {
      setError('Please enter your Order ID.')
      return
    }

    setLoading(true)

    try {
      // Step 1: Attempt lookup via Supabase Edge Function
      const { data, error: funcError } = await supabase.functions.invoke('track-shiprocket-order', {
        body: {
          order_id: trimmedOrderId,
          phone_number: trimmedPhone || undefined,
        },
      })

      if (!funcError && data && data.success) {
        setTrackingData(data)
        setLoading(false)
        return
      }

      // Step 2: Fallback to database RPC lookup if Edge Function is pending deployment
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedOrderId)
      if (isUuid) {
        const { data: dbData, error: dbError } = await supabase.rpc('get_order_status', {
          p_order_id: trimmedOrderId,
          p_phone: trimmedPhone || '',
        })

        if (!dbError && dbData && dbData.length > 0) {
          const row = dbData[0]
          setTrackingData({
            success: true,
            order_id: trimmedOrderId,
            current_status: row.order_status ? row.order_status.replace(/_/g, ' ') : 'Processing',
            courier_name: 'Shiprocket Partner',
            awb_code: row.tracking_id || 'Pending assignment',
            origin: 'Garba Vastra Warehouse',
            destination: 'Customer Address',
            edd: '3–5 Business Days',
            track_url: row.tracking_url || '',
            activities: [
              {
                status: `Order ${row.order_status ? row.order_status.replace(/_/g, ' ') : 'Placed'}`,
                activity: 'Order recorded in our fulfillment system',
                date: row.created_at || new Date().toISOString(),
                location: 'Garba Vastra Hub',
              },
            ],
          })
          setLoading(false)
          return
        }
      }

      // If both fail, display the returned error or user-friendly message
      const errorMsg =
        data?.error ||
        funcError?.message ||
        "Couldn't find tracking details for this Order ID. Please verify your Order ID and phone number."
      setError(errorMsg)
    } catch (err) {
      console.error('Tracking lookup error:', err)
      setError(err?.message || 'Something went wrong while fetching tracking details. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const activeStage = trackingData ? getStageIndex(trackingData.current_status) : -1
  const isCancelled = trackingData?.current_status?.toLowerCase().includes('cancel')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="text-xs uppercase tracking-widest font-bold text-marigold bg-maroon/10 px-3.5 py-1 rounded-full inline-block mb-3">
          Live Order Tracking
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-maroon font-semibold mb-3">
          Track Your Order
        </h1>
        <p className="text-ink/70 text-sm sm:text-base max-w-md mx-auto">
          Enter your Order ID and phone number to view live shipment updates from our courier partner.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white/80 backdrop-blur-md border border-maroon/15 rounded-2xl p-6 sm:p-8 shadow-sm mb-10">
        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label htmlFor="orderId" className="block text-xs font-semibold uppercase tracking-wider text-ink/70 mb-1.5">
              Order ID <span className="text-maroon">*</span>
            </label>
            <input
              id="orderId"
              type="text"
              required
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full bg-ivory/50 border border-maroon/20 rounded-xl px-4 py-3 text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon transition-all"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-ink/70 mb-1.5">
              Phone Number <span className="text-ink/40 font-normal">(Optional for verification)</span>
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-ivory/50 border border-maroon/20 rounded-xl px-4 py-3 text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon transition-all"
            />
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold">Tracking Lookup Failed</p>
                <p className="text-red-700 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-maroon text-ivory font-medium hover:bg-maroon-dark active:scale-[0.99] transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-ivory" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Fetching Tracking Status…</span>
              </>
            ) : (
              <>
                <span>Track Order</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Tracking Results Card */}
      {trackingData && (
        <div className="bg-white rounded-2xl border border-maroon/15 shadow-lg overflow-hidden transition-all">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-maroon to-maroon-dark text-ivory p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-ivory/70 font-medium">Tracking Order</p>
                <p className="text-lg font-bold font-mono tracking-tight">{trackingData.order_id}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                    isCancelled ? 'bg-red-200 text-red-900' : 'bg-marigold text-ink'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isCancelled ? 'bg-red-600' : 'bg-teal animate-pulse'}`}></span>
                  <span className="capitalize">{trackingData.current_status || 'In Transit'}</span>
                </span>
              </div>
            </div>

            {/* Quick Details Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-ivory/15 text-xs">
              <div>
                <span className="text-ivory/60 block">Courier</span>
                <span className="font-semibold text-ivory">{trackingData.courier_name || 'Shiprocket Partner'}</span>
              </div>
              <div>
                <span className="text-ivory/60 block">AWB / Tracking ID</span>
                <span className="font-mono font-medium text-ivory">{trackingData.awb_code || '—'}</span>
              </div>
              <div>
                <span className="text-ivory/60 block">Origin</span>
                <span className="font-medium text-ivory">{trackingData.origin || 'Surat Hub'}</span>
              </div>
              <div>
                <span className="text-ivory/60 block">Estimated Delivery</span>
                <span className="font-medium text-marigold-light">{trackingData.edd || '3–5 Business Days'}</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Visual Stepper Progress Bar */}
            {!isCancelled && (
              <div className="mb-10 pt-2">
                <h2 className="text-xs uppercase tracking-wider font-bold text-ink/50 mb-6">Delivery Progress</h2>
                <div className="relative flex justify-between">
                  <div className="absolute top-4 left-4 right-4 h-1 bg-maroon/10 -z-0" />
                  <div
                    className="absolute top-4 left-4 h-1 bg-teal transition-all duration-700 -z-0"
                    style={{
                      width: `${Math.min(100, Math.max(0, (activeStage / (PROGRESS_STAGES.length - 1)) * 100))}%`,
                    }}
                  />

                  {PROGRESS_STAGES.map((stage, idx) => {
                    const isCompleted = idx < activeStage
                    const isCurrent = idx === activeStage

                    return (
                      <div key={stage.key} className="flex flex-col items-center text-center relative z-10 flex-1 px-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            isCompleted
                              ? 'bg-teal text-white ring-4 ring-teal/20'
                              : isCurrent
                              ? 'bg-maroon text-ivory ring-4 ring-marigold/50 scale-110 shadow-md'
                              : 'bg-ivory border-2 border-maroon/20 text-ink/40'
                          }`}
                        >
                          {isCompleted ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <p
                          className={`text-[11px] sm:text-xs mt-2.5 font-medium leading-tight ${
                            isCurrent
                              ? 'text-maroon font-bold'
                              : isCompleted
                              ? 'text-teal font-semibold'
                              : 'text-ink/40'
                          }`}
                        >
                          {stage.label}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm mb-6">
                This shipment was cancelled. If you believe this is in error, please contact customer support.
              </div>
            )}

            {/* Timeline Activities List */}
            <div>
              <h2 className="text-xs uppercase tracking-wider font-bold text-ink/50 mb-4">Activity Log</h2>

              {trackingData.activities && trackingData.activities.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-maroon/10">
                  {trackingData.activities.map((act, index) => (
                    <div key={index} className="relative flex items-start gap-4 pl-8 group">
                      <div
                        className={`absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white transition-all ${
                          index === 0
                            ? 'border-teal bg-teal ring-4 ring-teal/20'
                            : 'border-maroon/40 bg-ivory'
                        }`}
                      />

                      <div className="flex-1 bg-ivory/40 hover:bg-ivory/80 transition-colors p-3.5 rounded-xl border border-maroon/10">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <p className="text-xs font-semibold text-ink/90">
                            {act.status || act.activity || 'Status Update'}
                          </p>
                          <span className="text-[11px] text-ink/50 font-mono">
                            {formatTimelineDate(act.date)}
                          </span>
                        </div>
                        {act.activity && act.activity !== act.status && (
                          <p className="text-xs text-ink/70 mb-1">{act.activity}</p>
                        )}
                        {act.location && (
                          <p className="text-[11px] text-teal font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {act.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-ivory/60 border border-maroon/10 text-center">
                  <p className="text-xs text-ink/60">
                    Shipment has been initiated with {trackingData.courier_name || 'the carrier'}. Detailed tracking updates will populate as the parcel moves through scan hubs.
                  </p>
                </div>
              )}
            </div>

            {/* External Tracking Link */}
            {trackingData.track_url && (
              <div className="mt-8 pt-4 border-t border-maroon/10 flex justify-end">
                <a
                  href={trackingData.track_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal hover:text-maroon transition-colors hover:underline"
                >
                  <span>Open Official Courier Tracking Page</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
