import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../lib/CartContext';
import { useWishlist } from '../lib/WishlistContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      setProduct(data);
      if (data?.sizes?.length) setSelectedSize(data.sizes[0]);
      if (data?.colors?.length) setSelectedColor(data.colors[0]);
      setLoading(false);
    }
    fetchProduct();

    const channel = supabase
      .channel(`product-${id}-stock`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "products",
        filter: `id=eq.${id}`
      }, (payload) => {
        setProduct(prev => ({ ...prev, ...payload.new }));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  if (loading) return Loading…;
  if (!product) return Piece not found.;

  const stock = product.stock ?? 0;
  const isSoldOut = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;
  const isSaved = isInWishlist(product.id);

  // Calculate discount percentage safely
  const discount = product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

  async function handleAddToCart() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("Please log in to add items to your cart.");
      navigate('/login');
      return;
    }

    addItem(product, selectedSize, selectedColor, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    
      {/* Left Column: Image & Wishlist */}
      
         {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-ivory/80 backdrop-blur shadow-sm hover:bg-ivory transition-colors"
        >
          
            {isSaved ? '♥' : '♡'}
          
        
        
      

      {/* Right Column: Details */}
      
        ← Back to shop
        {product.name}
        {product.category}

        {/* Indya-Style Price Section */}
        
          ₹{product.price.toLocaleString("en-IN")}
          {product.mrp > product.price && (
            <>
              ₹{product.mrp.toLocaleString("en-IN")}
              ({discount}% OFF)
            
          )}
        
        MRP (Inclusive of all taxes)

        {/* SKU */}
        {product.sku && SKU: {product.sku}}

        {/* Stock Badges */}
        {isLowStock && !isSoldOut && (
          
            Only {stock} left — updates live as others buy
          
        )}
        {isSoldOut && (
          
            Currently sold out
          
        )}

        {/* Indya-Style Specifications List */}
        
          Description
          {product.description}
          
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            
              {Object.entries(product.specifications).map(([key, value]) => (
                {key} : {value}
              ))}
            
          )}
        

        {/* Size Selector */}
        {product.sizes?.length > 0 && (
          
            Size
            
              {product.sizes.map(size => (
                 setSelectedSize(size)}
                  className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${selectedSize === size ? "bg-maroon text-ivory border-maroon" : "border-maroon/30 text-ink hover:border-maroon"}`}
                >
                  {size}
                
              ))}
            
          
        )}

        {/* Color Selector */}
        {product.colors?.length > 0 && (
          
            Color
            
              {product.colors.map(color => (
                 setSelectedColor(color)}
                  className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${selectedColor === color ? "bg-maroon text-ivory border-maroon" : "border-maroon/30 text-ink hover:border-maroon"}`}
                >
                  {color}
                
              ))}
            
          
        )}

        
          {isSoldOut ? 'Sold out' : added ? 'Added ✓' : 'Add to cart'}
        
      
    
  );
}
