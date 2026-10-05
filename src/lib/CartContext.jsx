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

  // A cart line is unique per product + size + color (+ rental date, if a rental)
  function lineKey(productId, size, color, rentalDate) {
    return `${productId}::${size}::${color}::${rentalDate || ''}`
  }

  function addItem(product, size, color, qty = 1, rentalInfo = null) {
    setItems((prev) => {
      const rentalDate = rentalInfo?.rentalDate || null
      const key = lineKey(product.id, size, color, rentalDate)
      const existing = prev.find((i) => lineKey(i.productId, i.size, i.color, i.rentalDate) === key)

      // Rentals are always a single booking for one date — never stack quantity
      if (existing && !rentalInfo) {
        return prev.map((i) =>
          lineKey(i.productId, i.size, i.color, i.rentalDate) === key ? { ...i, qty: i.qty + qty } : i
        )
      }
      if (existing && rentalInfo) return prev // already booked, no-op

      const baseItem = {
        productId: product.id,
        name: product.name,
        image: product.image_url,
        size,
        color,
        qty: rentalInfo ? 1 : qty,
      }

      if (rentalInfo) {
        return [
          ...prev,
          {
            ...baseItem,
            isRental: true,
            rentalDate: rentalInfo.rentalDate,
            rentalPrice: rentalInfo.rentalPrice,
            rentalDeposit: rentalInfo.rentalDeposit,
            price: rentalInfo.rentalPrice + rentalInfo.rentalDeposit,
          },
        ]
      }

      return [...prev, { ...baseItem, price: product.price }]
    })
  }

  function updateQty(productId, size, color, qty, rentalDate = null) {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => lineKey(i.productId, i.size, i.color, i.rentalDate) !== lineKey(productId, size, color, rentalDate))
        : prev.map((i) =>
            lineKey(i.productId, i.size, i.color, i.rentalDate) === lineKey(productId, size, color, rentalDate)
              ? { ...i, qty: i.isRental ? 1 : qty } // rentals can't change quantity
              : i
          )
    )
  }

  function removeItem(productId, size, color, rentalDate = null) {
    setItems((prev) =>
      prev.filter((i) => lineKey(i.productId, i.size, i.color, i.rentalDate) !== lineKey(productId, size, color, rentalDate))
    )
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
