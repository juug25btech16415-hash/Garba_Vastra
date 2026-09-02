import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchOrders() {
      if (!user?.email) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('email', user.email)
          .order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setOrders(data || [])
      } catch (err) {
        console.error('Error fetching user orders:', err)
        setError(err.message || 'Failed to load order history.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user?.email])

  function getStatusBadge(status) {
    const s = (status || 'placed').toLowerCase()
    switch (s) {
      case 'delivered':
        return 'bg-teal/15 text-teal border-teal/30'
      case 'shipped':
      case 'in_transit':
      case 'out_for_delivery':
        return 'bg-amber-500/15 text-amber-700 border-amber-500/30'
      case 'packed':
        return 'bg-blue-500/15 text-blue-700 border-blue-500/30'
      case 'cancelled':
        return 'bg-red-500/15 text-red-700 border-red-500/30'
      default:
        return 'bg-maroon/10 text-maroon border-maroon/20'
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Dashboard Header */}
      <div className="border-b border-maroon/10 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-maroon">My Account</h1>
          <p className="text-ink/70 text-sm mt-1">
            Welcome back, <span className="font-semibold text-ink">{user?.user_metadata?.name || user?.email?.split('@')[0]}</span> ({user?.email})
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-maroon hover:text-maroon-dark transition-colors self-start sm:self-auto"
        >
          ← Continue Shopping
        </Link>
      </div>

      {/* Content Area */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-ink">Order History</h2>
          {!loading && orders.length > 0 && (
            <span className="text-xs sm:text-sm font-medium text-ink/60 bg-ivory/80 px-3 py-1 rounded-full border border-maroon/10">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse border border-maroon/10 rounded-xl p-6 bg-ivory/50">
                <div className="h-4 bg-maroon/10 rounded w-1/3 mb-4" />
                <div className="h-3 bg-maroon/10 rounded w-1/4 mb-6" />
                <div className="h-16 bg-maroon/5 rounded w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-center">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-maroon text-ivory text-xs rounded-md font-medium hover:bg-maroon-dark transition-colors"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-maroon/20 rounded-2xl bg-ivory/40 max-w-md mx-auto">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-maroon/10 text-maroon flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <h3 className="font-display text-xl text-ink mb-1">You haven't placed any orders yet</h3>
            <p className="text-sm text-ink/60 mb-6 max-w-xs mx-auto">
              Explore our handcrafted Navratri Chaniya Choli collection and find your festive twirl.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-2.5 rounded-md bg-maroon text-ivory text-sm font-medium hover:bg-maroon-dark transition-colors shadow-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const orderDate = order.created_at
                ? new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recent'

              const items = Array.isArray(order.items) ? order.items : []

              return (
                <div
                  key={order.id}
                  className="border border-maroon/15 rounded-xl bg-ivory/60 backdrop-blur-sm overflow-hidden shadow-sm transition-all hover:border-maroon/30"
                >
                  {/* Order Card Header */}
                  <div className="bg-maroon/[0.03] border-b border-maroon/10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                      <div>
                        <span className="text-ink/50 text-xs block">Order ID</span>
                        <span className="font-mono font-medium text-ink">#{order.id}</span>
                      </div>
                      <div>
                        <span className="text-ink/50 text-xs block">Date Placed</span>
                        <span className="font-medium text-ink">{orderDate}</span>
                      </div>
                      <div>
                        <span className="text-ink/50 text-xs block">Total Amount</span>
                        <span className="font-bold text-maroon font-display text-base">
                          ₹{Number(order.total || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${getStatusBadge(
                          order.order_status
                        )}`}
                      >
                        {(order.order_status || 'placed').replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4 sm:p-5">
                    <div className="divide-y divide-maroon/10">
                      {items.map((item, idx) => (
                        <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-12 h-14 object-cover rounded-md border border-maroon/10 shrink-0 bg-teal/5"
                              />
                            ) : (
                              <div className="w-12 h-14 rounded-md border border-maroon/10 shrink-0 bg-maroon/5 flex items-center justify-center text-maroon text-xs">
                                👗
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-ink truncate">{item.name}</p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-ink/60 mt-0.5">
                                {item.size && <span>Size: {item.size}</span>}
                                {item.color && <span>Color: {item.color}</span>}
                                <span>Qty: {item.qty}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-semibold text-ink">
                              ₹{Number((item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}
                            </span>
                            {item.qty > 1 && (
                              <span className="text-[11px] text-ink/50 block">
                                (₹{Number(item.price || 0).toLocaleString('en-IN')} each)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer & Actions */}
                    <div className="mt-5 pt-4 border-t border-maroon/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                      <div className="text-ink/60">
                        {order.address && (
                          <p className="truncate max-w-md">
                            <span className="font-medium text-ink">Shipping to:</span> {order.customer_name} ({order.city}, {order.pincode})
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          to={`/track?id=${order.id}`}
                          className="px-4 py-1.5 rounded-md border border-maroon/30 text-maroon font-medium hover:bg-maroon hover:text-ivory transition-colors text-xs inline-flex items-center gap-1"
                        >
                          Track Package →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
