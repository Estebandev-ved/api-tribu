import { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        try { return JSON.parse(localStorage.getItem('tribu_cart') || '[]') } catch { return [] }
    })

    // Persistir en localStorage cuando cambia el carrito
    useEffect(() => {
        localStorage.setItem('tribu_cart', JSON.stringify(items))
    }, [items])

    const addItem = (producto, qty = 1) => {
        setItems(prev => {
            const existe = prev.find(i => i.id === producto.id)
            if (existe) {
                toast.success(`${producto.nombre}: cantidad actualizada`)
                return prev.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + qty } : i)
            }
            toast.success(`${qty} x ${producto.nombre} añadido al carrito 🛒`)
            return [...prev, { ...producto, cantidad: qty }]
        })
    }

    const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id))

    const updateCantidad = (id, cantidad) => {
        if (cantidad < 1) { removeItem(id); return }
        setItems(prev => prev.map(i => i.id === id ? { ...i, cantidad } : i))
    }

    const clearCart = () => setItems([])

    const total = items.reduce((sum, i) => sum + (Number(i.precio) * i.cantidad), 0)
    const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0)

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateCantidad, clearCart, total, totalItems }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => useContext(CartContext)
