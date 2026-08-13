import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useCart } from '../lib/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('products').select('*').eq('id', id).single()
      setProduct(data)
      if (data?.sizes?.length) setSize(data.sizes[0])
      if (data?.colors?.length) setColor(data.colors[0])
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel(`product-${id}-stock`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${id}` },
        (payload) => setProduct((prev) => ({ ...prev, ...payload.new }))
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id])

  if (loading) return <p className="text-center py-24 text-ink/50">Loading…</p>
  if (!product) return <p className="text-center py-24 text-ink/50">Piece not found.</p>

  const stock = product.stock ?? 0
  const isOut = stock <= 0

  function handleAdd() {
    addItem(product, size, color, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-10 grid md:grid-cols-2 gap-10">
      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-teal/5 border border-maroon/10">
        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
      </div>

      <div>
        <Link to="/" className="text-sm text-ink/50 hover:text-maroon">
          ← Back to shop
        </Link>
        <h1 className="font-display text-4xl text-maroon mt-3">{product.name}</h1>
        <p className="text-ink/60 mt-1">{product.category}</p>
        <p className="font-display text-2xl text-ink mt-4">₹{product.price.toLocaleString('en-IN')}</p>

        {stock > 0 && stock <= 5 && (
          <p className="mt-2 inline-block text-sm font-semibold text-maroon bg-maroon/10 px-3 py-1 rounded-full">
            Only {stock} left — updates live as others buy
          </p>
        )}
        {isOut && (
          <p className="mt-2 inline-block text-sm font-semibold text-ink/60 bg-ink/10 px-3 py-1 rounded-full">
            Currently sold out
          </p>
        )}

        <p className="mt-6 text-ink/70 leading-relaxed">{product.description}</p>

        {product.sizes?.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium mb-2">Size</p>
            <div className="flex gap-2 flex-wrap">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                    size === s
                      ? 'bg-maroon text-ivory border-maroon'
                      : 'border-maroon/30 text-ink hover:border-maroon'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.colors?.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-medium mb-2">Color</p>
            <div className="flex gap-2 flex-wrap">
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                    color === c
                      ? 'bg-maroon text-ivory border-maroon'
                      : 'border-maroon/30 text-ink hover:border-maroon'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={isOut}
          className="mt-8 w-full sm:w-auto px-8 py-3.5 rounded-md bg-maroon text-ivory font-medium hover:bg-maroon-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isOut ? 'Sold out' : added ? 'Added ✓' : 'Add to cart'}
        </button>
      </div>
    </div>
  )
}
