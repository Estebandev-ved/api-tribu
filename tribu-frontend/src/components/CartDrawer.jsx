import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function CartDrawer({ open, onClose }) {
    const { items, removeItem, updateCantidad, total, totalItems } = useCart()

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300 }}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{
                            position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 301,
                            width: '100%', maxWidth: 420,
                            background: 'var(--color-surface)',
                            borderLeft: '1px solid var(--color-border)',
                            display: 'flex', flexDirection: 'column',
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <ShoppingCart size={20} />
                                <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Mi Carrito</h2>
                                {totalItems > 0 && (
                                    <span style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.8rem', fontWeight: 700 }}>
                                        {totalItems}
                                    </span>
                                )}
                            </div>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                <X size={22} />
                            </motion.button>
                        </div>

                        {/* Items */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                            {items.length === 0 ? (
                                <div className="empty-state" style={{ marginTop: '3rem' }}>
                                    <ShoppingCart size={64} />
                                    <p style={{ marginTop: '1rem' }}>Tu carrito está vacío</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)', marginTop: '0.5rem' }}>Añade productos para empezar</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {items.map(item => (
                                        <motion.div key={item.id}
                                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                            style={{
                                                display: 'flex', gap: '1rem', padding: '1rem',
                                                borderRadius: 'var(--radius-md)', marginBottom: '0.75rem',
                                                background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                                            }}
                                        >
                                            {/* Imagen */}
                                            <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--color-bg)' }}>
                                                {item.imagenUrl
                                                    ? <img src={item.imagenUrl} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.5rem' }}>🛍️</div>
                                                }
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</p>
                                                <p style={{ color: 'var(--color-primary-light)', fontWeight: 700, fontSize: '0.9rem' }}>{formatCOP(item.precio)}</p>
                                                {/* Cantidad */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    <motion.button whileTap={{ scale: 0.85 }}
                                                        onClick={() => updateCantidad(item.id, item.cantidad - 1)}
                                                        style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', color: 'var(--color-text)' }}>
                                                        <Minus size={12} />
                                                    </motion.button>
                                                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center', fontSize: '0.9rem' }}>{item.cantidad}</span>
                                                    <motion.button whileTap={{ scale: 0.85 }}
                                                        onClick={() => updateCantidad(item.id, item.cantidad + 1)}
                                                        style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', color: 'var(--color-text)' }}>
                                                        <Plus size={12} />
                                                    </motion.button>
                                                </div>
                                            </div>

                                            {/* Eliminar */}
                                            <motion.button whileHover={{ scale: 1.1, color: '#ef4444' }} whileTap={{ scale: 0.9 }}
                                                onClick={() => removeItem(item.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', alignSelf: 'flex-start' }}>
                                                <Trash2 size={16} />
                                            </motion.button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>Total</span>
                                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-primary-light)' }}>
                                        {formatCOP(total)}
                                    </span>
                                </div>
                                <Link to="/checkout" onClick={onClose} className="btn btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem' }}>
                                    Ir al pago <ArrowRight size={18} />
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
