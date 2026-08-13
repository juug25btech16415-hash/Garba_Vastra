import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ProductCard from '../components/ProductCard'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel

    async function load() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (!error) setProducts(data || [])
      setLoading(false)
    }
    load()

    // Real-time: whenever stock changes anywhere (someone else buys, or you restock),
    // every open browser tab updates instantly without a page refresh.
    channel = supabase
      .channel('products-stock-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          setProducts((prev) =>
            prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.new.is_active) {
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
      <section className="relative overflow-hidden bandhani-dots-teal">
        <div className="absolute inset-0 bg-gradient-to-b from-ivory/40 via-ivory/85 to-ivory" />
        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-14 text-center">
          <p className="font-medium text-teal tracking-[0.2em] text-xs uppercase mb-4">
            Festive wear, made for the raas
          </p>
          <h1 className="font-display text-5xl sm:text-6xl text-maroon leading-tight">
            Chaniya Choli for
            <br /> every twirl of Navratri
          </h1>
          <p className="mt-5 text-ink/70 max-w-md mx-auto">
            Mirror-work, bandhani, and hand-embroidered pieces — in limited counts,
            so what you see is what's really left.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-20">
        {loading ? (
          <p className="text-center text-ink/50 py-20">Loading collection…</p>
        ) : products.length === 0 ? (
          <p className="text-center text-ink/50 py-20">
            No pieces listed yet — check back soon.
          </p>
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
