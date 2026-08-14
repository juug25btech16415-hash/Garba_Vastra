import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useWishlist } from '../lib/WishlistContext'
import ProductCard from '../components/ProductCard'

export default function Wishlist() {
  const { ids } = useWishlist()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }
    supabase
      .from('products')
      .select('*')
      .in('id', ids)
      .then(({ data }) => {
        setProducts(data || [])
        setLoading(false)
      })
  }, [ids])

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl text-maroon mb-8">Your wishlist</h1>

      {loading && <p className="text-ink/50">Loading…</p>}

      {!loading && products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-ink/60 mb-4">Nothing saved yet — tap the heart on any piece you love.</p>
          <Link to="/" className="text-maroon font-medium hover:underline">Browse the shop →</Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
