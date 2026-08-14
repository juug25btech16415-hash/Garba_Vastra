import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const initialProductState = {
  id: null,
  name: "",
  description: "",
  price: "",
  mrp: "",          
  sku: "",          
  specifications: "", 
  category: "Chaniya Choli",
  sizes: "",
  colors: "",
  stock: "",
  is_active: true,
  image_url: ""
};

export default function Admin() {
  const navigate = useNavigate();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState(initialProductState);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setLoadingAuth(false);
        fetchProducts();
        fetchOrders();
      } else {
        navigate("/admin/login");
      }
    });
  }, [navigate]);

  async function fetchProducts() {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
  }

  async function fetchOrders() {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  function updateForm(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleEdit(p) {
    // Convert the JSON object back to a comma-separated string for the form
    let specsString = "";
    if (p.specifications) {
      specsString = Object.entries(p.specifications)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    }

    setFormData({
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: p.price,
      mrp: p.mrp || "",       
      sku: p.sku || "",       
      specifications: specsString, 
      category: p.category || "",
      sizes: (p.sizes || []).join(", "),
      colors: (p.colors || []).join(", "),
      stock: p.stock,
      is_active: p.is_active,
      image_url: p.image_url
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setFormData(initialProductState);
    setImageFile(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      let finalImageUrl = formData.image_url;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      if (!finalImageUrl) throw new Error("Please add an image (upload a file or paste a URL).");

      // Convert "Fabric: Silk, Pattern: Printed" into a proper JSON object
      const specsObj = {};
      if (formData.specifications) {
        formData.specifications.split(',').forEach(pair => {
          const [key, val] = pair.split(':');
          if (key && val) specsObj[key.trim()] = val.trim();
        });
      }

      const productPayload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        mrp: Number(formData.mrp) || 0, 
        sku: formData.sku,            
        specifications: specsObj,     
        category: formData.category,
        sizes: formData.sizes.split(",").map(s => s.trim()).filter(Boolean),
        colors: formData.colors.split(",").map(c => c.trim()).filter(Boolean),
        stock: Number(formData.stock),
        is_active: formData.is_active,
        image_url: finalImageUrl
      };

      if (formData.id) {
        const { error } = await supabase.from("products").update(productPayload).eq("id", formData.id);
        if (error) throw error;
        setMessage("Product updated ✓");
      } else {
        const { error } = await supabase.from("products").insert(productPayload);
        if (error) throw error;
        setMessage("Product added ✓");
      }

      handleCancelEdit();
      fetchProducts();
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (window.confirm("Delete this product? This cannot be undone.")) {
      await supabase.from("products").delete().eq("id", id);
      fetchProducts();
    }
  }

  async function handleRestock(id, currentStock) {
    const qty = window.prompt("Add how many pieces to stock?", "5");
    if (qty && !isNaN(qty)) {
      await supabase.from("products").update({ stock: currentStock + Number(qty) }).eq("id", id);
      fetchProducts();
    }
  }

  async function handleOrderStatus(id, updates) {
    await supabase.from("orders").update(updates).eq("id", id);
    fetchOrders();
  }

  if (loadingAuth) return Checking login…;

  const orderStatuses = ["placed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "needs_review"];

  return (
    
      
        Admin dashboard
        Log out
      

      
        {["products", "orders"].map(tab => (
           setActiveTab(tab)}
            className={`pb-3 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${activeTab === tab ? "border-maroon text-maroon" : "border-transparent text-ink/50 hover:text-ink"}`}
          >
            {tab}
          
        ))}
      

      {activeTab === "products" && (
        
          {/* Form Section */}
          
            
              {formData.id ? "Edit piece" : "Add a new piece"}
            
            
               updateForm("name", e.target.value)} required className="w-full border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40" />
               updateForm("description", e.target.value)} rows={3} className="w-full border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40" />
              
              <div className="flex gap-3">
                <input type="number" placeholder="Price (₹)" value={formData.price} onChange={e => updateForm("price", e.target.value)} required className="flex-1 border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40" />
                <input type="number" placeholder="MRP (Original Price)" value={formData.mrp} onChange={e => updateForm("mrp", e.target.value)} className="flex-1 border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40" />
              </div>
              
              <div className="flex gap-3">
                <input placeholder="SKU (e.g. XLH60610)" value={formData.sku} onChange={e => updateForm("sku", e.target.value)} className="flex-1 border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40" />
                <input type="number" placeholder="Stock count" value={formData.stock} onChange={e => updateForm("stock", e.target.value)} required className="flex-1 border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40" />
              </div>
              
              <textarea placeholder="Specifications (e.g. Fabric: Silk Blend, Pattern: Printed, Neck: Sweetheart)" value={formData.specifications} onChange={e => updateForm("specifications", e.target.value)} rows={2} className="w-full border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40" />
              
              <input placeholder="Category (e.g. Chaniya Choli, Dupatta)" value={formData.category} onChange={e => updateForm("category", e.target.value)} className="w-full border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40" />
              <input placeholder="Sizes, comma separated (e.g. S, M, L, XL)" value={formData.sizes} onChange={e => updateForm("sizes", e.target.value)} className="w-full border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40" />
              <input placeholder="Colors, comma separated (e.g. Red, Teal)" value={formData.colors} onChange={e => updateForm("colors", e.target.value)} className="w-full border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40" />
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Photo</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="text-sm" />
                <p className="text-xs text-ink/50 mt-1">or paste an image URL below instead</p>
                <input placeholder="Image URL" value={formData.image_url} onChange={e => updateForm("image_url", e.target.value)} className="w-full mt-1.5 border border-maroon/20 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/40" />
              </div>
              
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.is_active} onChange={e => updateForm("is_active", e.target.checked)} />
                Visible on the shop
              </label>
              
              {message && <p className="text-sm text-maroon">{message}</p>}
              
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-md bg-maroon text-ivory font-medium hover:bg-maroon-dark transition-colors disabled:opacity-50">
                  {saving ? "Saving…" : formData.id ? "Save changes" : "Add piece"}
                </button>
                {formData.id && (
                  <button type="button" onClick={handleCancelEdit} className="px-4 py-3 rounded-md border border-maroon/20 text-sm">Cancel</button>
                )}
              </div>
            </form>
          </div>

          {/* List Section */}
          <div>
            <h2 className="font-display text-xl text-maroon mb-4">Your pieces ({products.length})</h2>
            <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
              {products.map(p => (
                <div key={p.id} className="flex gap-3 border border-maroon/10 rounded-md p-3">
                  <img src={p.image_url} alt={p.name} className="w-16 h-20 object-cover rounded bg-teal/5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-sm text-ink/60">₹{p.price} · Stock: {p.stock} {!p.is_active && "· Hidden"}</p>
                    <div className="flex gap-3 mt-1 text-xs">
                      <button onClick={() => handleEdit(p)} className="text-teal hover:underline">Edit</button>
                      <button onClick={() => handleRestock(p.id, p.stock)} className="text-teal hover:underline">+ Restock</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-700 hover:underline">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && <p className="text-ink/50 text-sm">No pieces yet — add your first one.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 && <p className="text-ink/50 text-sm">No orders yet.</p>}
          {orders.map(o => (
            <div key={o.id} className="border border-maroon/10 rounded-md p-4">
              <div className="flex justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium">{o.customer_name} · {o.phone}</p>
                  <p className="text-sm text-ink/60">{o.address}, {o.city} — {o.pincode}</p>
                  <p className="text-sm text-ink/60 mt-1">{new Date(o.created_at).toLocaleString("en-IN")} · ₹{o.total}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${o.payment_status === "paid" ? "bg-teal/10 text-teal" : "bg-red-50 text-red-700"}`}>
                    {o.payment_status}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-sm text-ink/70">
                {(o.items || []).map((item, idx) => (
                  <p key={idx}>{item.qty} × {item.name} {item.size && `(${item.size}`}{item.color && `, ${item.color}`}{item.size && ")"}</p>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={o.order_status}
                  onChange={e => handleOrderStatus(o.id, { order_status: e.target.value })}
                  className="border border-maroon/20 rounded-md px-3 py-1.5 text-sm"
                >
                  {orderStatuses.map(status => (
                    <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <input
                  placeholder="Tracking ID"
                  defaultValue={o.tracking_id || ""}
                  onBlur={e => handleOrderStatus(o.id, { tracking_id: e.target.value })}
                  className="border border-maroon/20 rounded-md px-3 py-1.5 text-sm w-36"
                />
                <input
                  placeholder="Tracking URL (courier link)"
                  defaultValue={o.tracking_url || ""}
                  onBlur={e => handleOrderStatus(o.id, { tracking_url: e.target.value })}
                  className="border border-maroon/20 rounded-md px-3 py-1.5 text-sm flex-1 min-w-[180px]"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
