import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/client'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem('dg_cart')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const persist = (newItems) => {
    setItems(newItems)
    localStorage.setItem('dg_cart', JSON.stringify(newItems))
  }

  const addItem = useCallback((product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      const updated = existing
        ? prev.map(i => i.product_id === product.id
            ? { ...i, quantity: i.quantity + qty }
            : i)
        : [...prev, {
            product_id:   product.id,
            product_name: product.name,
            unit_price:   parseFloat(product.price),
            delivery_cost: parseFloat(product.delivery_cost),
            image:        product.image,
            quantity:     qty,
          }]
      localStorage.setItem('dg_cart', JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeItem = useCallback((productId) => {
    setItems(prev => {
      const updated = prev.filter(i => i.product_id !== productId)
      localStorage.setItem('dg_cart', JSON.stringify(updated))
      return updated
    })
  }, [])

  const updateQty = useCallback((productId, qty) => {
    setItems(prev => {
      const updated = qty <= 0
        ? prev.filter(i => i.product_id !== productId)
        : prev.map(i => i.product_id === productId ? { ...i, quantity: qty } : i)
      localStorage.setItem('dg_cart', JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearCart = useCallback(() => {
    localStorage.removeItem('dg_cart')
    setItems([])
  }, [])

  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
  const deliveryCost = items.reduce((max, i) => Math.max(max, i.delivery_cost || 0), 0)
  const total = subtotal + deliveryCost
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, subtotal, deliveryCost, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
