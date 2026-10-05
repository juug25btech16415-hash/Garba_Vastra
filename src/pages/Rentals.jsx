import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ProductCard from '../components/ProductCard'

export default function Rentals() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel

    async function load() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_rental', true)
        .order('created_at', { ascending: false })

      if (!error) setProducts(data || [])
      setLoading(false)
    }
    load()

    // Real-time: keep rental stock counts in sync across tabs
    channel = supabase
      .channel('rental-products-stock')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === payload.new.id ? { ...p, ...payload.new } : p
            )
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.new.is_active && payload.new.is_rental) {
            setProducts((prev) => [payload.new, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div>
      {/* Hero section — mirrors Home.jsx shell exactly */}
      <section className="relative overflow-hidden bandhani-dots-teal">
        <div className="absolute inset-0 bg-gradient-to-b from-ivory/40 via-ivory/85 to-ivory" />

        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-14 text-center">
          {/* Rental-window badge */}
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="shimmer-badge text-ink text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full shadow-sm">
              🗓 Oct 9 – Oct 25 · Jain University Exclusive
            </span>
          </div>

          <p className="font-medium text-teal tracking-[0.2em] text-xs uppercase mb-4">
            Book your look · Return after Navratri
          </p>

          <h1 className="font-display text-5xl sm:text-6xl text-maroon leading-tight">
            Exclusive Rentals for
            <br />
            <span className="text-teal">Jain University</span>
          </h1>

          <p className="mt-5 text-ink/70 max-w-lg mx-auto">
            Pick your piece, choose your dates, and return it after the
            garba nights. Mirror-work and bandhani Chaniya Cholis — in
            limited counts. Jain University student ID required at pickup.
          </p>

          {/* How-it-works strip */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm">
            {[
              { icon: '🛍', label: 'Browse & pick a style' },
              { icon: '📅', label: 'Choose rental dates' },
              { icon: '💳', label: 'Pay the rental fee online' },
              { icon: '🔄', label: 'Return after Navratri' },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-ivory/80 border border-maroon/15 rounded-full px-4 py-2 text-ink/80 font-medium shadow-sm"
              >
                <span className="text-base">{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        {/* Sub-header */}
        <div className="flex items-center justify-between py-8 border-b border-maroon/10 mb-8">
          <div>
            <h2 className="font-display text-2xl text-ink">
              Available for Rental
            </h2>
            {!loading && (
              <p className="text-sm text-ink/50 mt-0.5">
                {products.length === 0
                  ? 'No rental pieces listed yet'
                  : `${products.length} piece${products.length !== 1 ? 's' : ''} available`}
              </p>
            )}
          </div>
          <span className="text-xs font-semibold text-maroon bg-maroon/8 border border-maroon/20 px-3 py-1.5 rounded-full uppercase tracking-wide">
            🪔 Navratri 2026
          </span>
        </div>

        {loading ? (
          /* Skeleton shimmer grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] w-full rounded-lg bg-maroon/10" />
                <div className="mt-3 h-5 bg-maroon/10 rounded w-3/4" />
                <div className="mt-1.5 h-4 bg-maroon/6 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 text-ink/40">
            <p className="font-display text-3xl mb-3">Coming soon</p>
            <p className="text-sm">
              Rental pieces will appear here once they're listed — check back
              closer to Oct 9.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
