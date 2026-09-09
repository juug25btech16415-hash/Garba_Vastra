import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useCart } from '../lib/CartContext'
import { useWishlist } from '../lib/WishlistContext'
import { SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } from '../lib/shipping'

function Gallery({ media = [], name, poster }) {
  const scrollerRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  function scrollToIndex(i) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
    setActiveIndex(i)
  }

  function handleScroll() {
    const el = scrollerRef.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    setActiveIndex(i)
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="aspect-[3/4] rounded-lg overflow-x-auto flex snap-x snap-mandatory scroll-smooth bg-teal/5 border border-maroon/10"
        style={{ scrollbarWidth: 'none' }}
      >
        {media.map((item, i) =>
          item.type === 'video' ? (
            <div
              key={`video-${i}`}
              className="w-full h-full flex-shrink-0 snap-center bg-black/95 flex items-center justify-center relative overflow-hidden"
            >
              <video
                src={item.src}
                poster={poster}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <img
              key={`img-${i}`}
              src={item.src}
              alt={`${name || 'Product'} — photo ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover flex-shrink-0 snap-center"
            />
          )
        )}
      </div>

      {media.length > 1 && (
        <>
          <button
            onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            aria-label="Previous media"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-ivory/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform disabled:opacity-0 z-10"
          >
            ←
          </button>
          <button
            onClick={() => scrollToIndex(Math.min(media.length - 1, activeIndex + 1))}
            disabled={activeIndex === media.length - 1}
            aria-label="Next media"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-ivory/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform disabled:opacity-0 z-10"
          >
            →
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-ivory/90 backdrop-blur px-2.5 py-1 rounded-full shadow-sm z-10">
            {media.map((item, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to ${item.type === 'video' ? 'video' : `photo ${i + 1}`}`}
                className={`transition-all flex items-center justify-center ${
                  i === activeIndex
                    ? item.type === 'video'
                      ? 'bg-maroon text-ivory text-[10px] px-2 py-0.5 rounded-full font-semibold'
                      : 'bg-maroon w-4 h-1.5 rounded-full'
                    : item.type === 'video'
                    ? 'bg-maroon/30 hover:bg-maroon/60 text-maroon text-[10px] px-1.5 py-0.5 rounded-full font-semibold'
                    : 'bg-maroon/30 hover:bg-maroon/60 w-1.5 h-1.5 rounded-full'
                }`}
              >
                {item.type === 'video' ? '▶ Video' : ''}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { isWishlisted, toggle } = useWishlist()

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

  const mediaItems = []
  if (product.image_url) {
    mediaItems.push({ type: 'image', src: product.image_url })
  }
  if (product.video_url) {
    mediaItems.push({ type: 'video', src: product.video_url })
  }
  if (product.images && product.images.length > 0) {
    product.images.forEach((url) => {
      if (url && url !== product.image_url) {
        mediaItems.push({ type: 'image', src: url })
      }
    })
  }

  function handleAdd() {
    addItem(product, size, color, 1)
    setAdded(true)
    navigate('/cart')
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-10 grid md:grid-cols-2 gap-10">
      <div className="relative">
        <Gallery
          media={mediaItems}
          name={product.name}
          poster={product.image_url}
        />
        <button
          onClick={() => toggle(product.id)}
          aria-label="Toggle wishlist"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-ivory/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform text-xl z-10"
        >
          <span className={isWishlisted(product.id) ? 'text-maroon' : 'text-ink/30'}>
            {isWishlisted(product.id) ? '♥' : '♡'}
          </span>
        </button>
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

        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="mt-6 border-t border-maroon/10 pt-6">
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="text-ink/50">{key}</dt>
                  <dd className="text-ink/85">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

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

        <p className="mt-4 text-xs text-ink/50">
          Shipping ₹{SHIPPING_FEE} · Free above ₹{FREE_SHIPPING_THRESHOLD.toLocaleString('en-IN')} · Delivered in 5–8 days
        </p>
      </div>
    </div>
  )
}