import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const EMPTY_FORM = {
  id: null,
  name: '',
  description: '',
  price: '',
  category: 'Chaniya Choli',
  sizes: '',
  colors: '',
  stock: '',
  is_active: true,
  image_url: '',
}

export default function Admin() {
  const navigate = useNavigate()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [tab, setTab] = useState('products')

  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate('/admin/login')
      } else {
        setCheckingAuth(false)
        loadProducts()
        loadOrders()
      }
    })
  }, [])

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
  }

  async function loadOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    setOrders(data || [])
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function editProduct(p) {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: p.price,
      category: p.category || '',
      sizes: (p.sizes || []).join(', '),
      colors: (p.colors || []).join(', '),
      stock: p.stock,
      is_active: p.is_active,
      image_url: p.image_url,
    })
    setImageFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setImageFile(null)
  }

  async function handleSaveProduct(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      let imageUrl = form.image_url

      // If a new file was chosen, upload it to Supabase Storage first
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, imageFile)
        if (uploadError) throw uploadError
        const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path)
        imageUrl = publicUrlData.publicUrl
      }

      if (!imageUrl) throw new Error('Please add an image (upload a file or paste a URL).')

      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
        stock: Number(form.stock),
        is_active: form.is_active,
        image_url: imageUrl,
      }

      if (form.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', form.id)
        if (error) throw error
        setMessage('Product updated ✓')
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
        setMessage('Product added ✓')
      }

      resetForm()
      loadProducts()
    } catch (err) {
      setMessage('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product? This cannot be undone.')) return
    await supabase.from('products').delete().eq('id', id)
    loadProducts()
  }

  async function quickRestock(id, currentStock) {
    const amount = prompt('Add how many pieces to stock?', '5')
    if (!amount || isNaN(amount)) return
    await supabase.from('products').update({ stock: currentStock + Number(amount) }).eq('id', id)
    loadProducts()
  }

  async function updateOrder(id, fields) {
    await supabase.from('orders').update(fields).eq('id', id)
    loadOrders()
  }

  if (checkingAuth) return <p className="text-center py-24 text-ink/50">Checking login…</p>

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-maroon">Admin dashboard</h1>
        <button onClick={handleLogout} className="text-sm text-ink/50 hover:text-maroon">
          Log out
        </button>
      </div>

      <div className="flex gap-6 border-b border-maroon/10 mb-8">
        {['products', 'orders'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-maroon text-maroon' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-xl text-maroon mb-4">
              {form.id ? 'Edit piece' : 'Add a new piece'}
            </h2>
            <form onSubmit={handleSaveProduct} className="space-y-3">
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                className="w-full border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                className="w-full border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                  required
                  className="flex-1 border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40"
                />
                <input
                  type="number"
                  placeholder="Stock count"
                  value={form.stock}
                  onChange={(e) => update('stock', e.target.value)}
                  required
                  className="flex-1 border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40"
                />
              </div>
              <input
                placeholder="Category (e.g. Chaniya Choli, Dupatta)"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="w-full border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40"
              />
              <input
                placeholder="Sizes, comma separated (e.g. S, M, L, XL)"
                value={form.sizes}
                onChange={(e) => update('sizes', e.target.value)}
                className="w-full border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40"
              />
              <input
                placeholder="Colors, comma separated (e.g. Red, Teal)"
                value={form.colors}
                onChange={(e) => update('colors', e.target.value)}
                className="w-full border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40"
              />

              <div>
                <label className="block text-sm font-medium mb-1.5">Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="text-sm"
                />
                <p className="text-xs text-ink/50 mt-1">or paste an image URL below instead</p>
                <input
                  placeholder="Image URL"
                  value={form.image_url}
                  onChange={(e) => update('image_url', e.target.value)}
                  className="w-full mt-1.5 border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => update('is_active', e.target.checked)}
                />
                Visible on the shop
              </label>

              {message && <p className="text-sm text-maroon">{message}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-md bg-maroon text-ivory font-medium hover:bg-maroon-dark transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : form.id ? 'Save changes' : 'Add piece'}
                </button>
                {form.id && (
                  <button type="button" onClick={resetForm} className="px-4 py-3 rounded-md border border-maroon/20 text-sm">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div>
            <h2 className="font-display text-xl text-maroon mb-4">Your pieces ({products.length})</h2>
            <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
              {products.map((p) => (
                <div key={p.id} className="flex gap-3 border border-maroon/10 rounded-md p-3">
                  <img src={p.image_url} alt={p.name} className="w-16 h-20 object-cover rounded bg-teal/5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-sm text-ink/60">₹{p.price} · Stock: {p.stock} {!p.is_active && '· Hidden'}</p>
                    <div className="flex gap-3 mt-1 text-xs">
                      <button onClick={() => editProduct(p)} className="text-teal hover:underline">Edit</button>
                      <button onClick={() => quickRestock(p.id, p.stock)} className="text-teal hover:underline">+ Restock</button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-700 hover:underline">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && <p className="text-ink/50 text-sm">No pieces yet — add your first one.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 && <p className="text-ink/50 text-sm">No orders yet.</p>}
          {orders.map((o) => (
            <div key={o.id} className="border border-maroon/10 rounded-md p-4">
              <div className="flex justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium">{o.customer_name} · {o.phone}</p>
                  <p className="text-sm text-ink/60">{o.address}, {o.city} — {o.pincode}</p>
                  <p className="text-sm text-ink/60 mt-1">
                    {new Date(o.created_at).toLocaleString('en-IN')} · ₹{o.total}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    o.payment_status === 'paid' ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-700'
                  }`}>
                    {o.payment_status}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-sm text-ink/70">
                {(o.items || []).map((it, idx) => (
                  <p key={idx}>
                    {it.qty} × {it.name} {it.size && `(${it.size}`}{it.color && `, ${it.color}`}{it.size && ')'}
                  </p>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={o.order_status}
                  onChange={(e) => updateOrder(o.id, { order_status: e.target.value })}
                  className="border border-maroon/20 rounded-md px-3 py-1.5 text-sm"
                >
                  {['placed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'needs_review'].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <input
                  placeholder="Tracking ID"
                  defaultValue={o.tracking_id || ''}
                  onBlur={(e) => updateOrder(o.id, { tracking_id: e.target.value })}
                  className="border border-maroon/20 rounded-md px-3 py-1.5 text-sm w-36"
                />
                <input
                  placeholder="Tracking URL (courier link)"
                  defaultValue={o.tracking_url || ''}
                  onBlur={(e) => updateOrder(o.id, { tracking_url: e.target.value })}
                  className="border border-maroon/20 rounded-md px-3 py-1.5 text-sm flex-1 min-w-[180px]"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
