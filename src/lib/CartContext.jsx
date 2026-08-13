import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'garba-vastra-cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // A cart line is unique per product + size + color combo
  function lineKey(productId, size, color) {
    return `${productId}::${size}::${color}`
  }

  function addItem(product, size, color, qty = 1) {
    setItems((prev) => {
      const key = lineKey(product.id, size, color)
      const existing = prev.find((i) => lineKey(i.productId, i.size, i.color) === key)
      if (existing) {
        return prev.map((i) =>
          lineKey(i.productId, i.size, i.color) === key ? { ...i, qty: i.qty + qty } : i
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image_url,
          size,
          color,
          qty,
        },
      ]
    })
  }

  function updateQty(productId, size, color, qty) {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => lineKey(i.productId, i.size, i.color) !== lineKey(productId, size, color))
        : prev.map((i) =>
            lineKey(i.productId, i.size, i.color) === lineKey(productId, size, color) ? { ...i, qty } : i
          )
    )
  }

  function removeItem(productId, size, color) {
    setItems((prev) => prev.filter((i) => lineKey(i.productId, i.size, i.color) !== lineKey(productId, size, color)))
  }

  function clearCart() {
    setItems([])
  }

  const totalQty = items.reduce((sum, i) => sum + i.qty, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.qty * i.price, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, removeItem, clearCart, totalQty, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
