import { motion } from 'framer-motion'
import { ShoppingCart, Flame, Users, TrendingUp, Clock } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const formatCOP = (n) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
}).format(n)

// Simula cuántas personas están viendo el producto (FOMO)
function useViewers(id) {
    const [count, setCount] = useState(() => 12 + Math.floor(Math.random() * 60))
    useEffect(() => {
        const t = setInterval(() => {
            setCount(c => Math.max(8, c + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3)))
        }, 4000 + Math.random() * 4000)
        return () => clearInterval(t)
    }, [id])
    return count
}

// Porcentaje de stock vendido (mock basado en stock actual)
function stockPercent(stock) {
    if (stock >= 50) return Math.floor(Math.random() * 20) + 40
    if (stock >= 20) return Math.floor(Math.random() * 20) + 60
    if (stock >= 10) return Math.floor(Math.random() * 15) + 75
    return Math.floor(Math.random() * 10) + 88
}

export default function ProductoCard({ producto, index = 0 }) {
    const { addItem } = useCart()
    const viewers = useViewers(producto.id)
    const [pct] = useState(() => stockPercent(producto.stock))

    return (
        <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.07 }}
            whileHover={{ y: -5 }}
            style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                transition: 'border-color 0.3s, box-shadow 0.3s',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255,87,34,0.35)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,87,34,0.12)'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.boxShadow = 'none'
            }}
        >
            {/* Imagen */}
            <div style={{ position: 'relative', aspectRatio: '1/1', background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                {producto.imagenUrl ? (
                    <Link to={`/producto/${producto.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                        <img src={producto.imagenUrl} alt={producto.nombre}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                    </Link>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem' }}>🛍️</div>
                )}

                {/* Badges superiores */}
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {producto.esViral && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="badge badge-viral">
                            <Flame size={9} /> VIRAL
                        </motion.span>
                    )}
                    {pct >= 85 && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15 }}
                            className="badge badge-trending">
                            🔥 HOT
                        </motion.span>
                    )}
                </div>

                {/* Badge TikTok */}
                {producto.esViral && (
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                        <span className="badge badge-tiktok" style={{ fontSize: '0.65rem' }}>
                            ▶ TikTok
                        </span>
                    </div>
                )}

                {/* Counter de personas viendo */}
                <motion.div
                    key={viewers}
                    initial={{ opacity: 0.7 }} animate={{ opacity: 1 }}
                    style={{
                        position: 'absolute', bottom: 10, left: 10,
                        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                        borderRadius: '9999px', padding: '3px 10px',
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: '0.72rem', fontWeight: 700, color: '#fff',
                    }}
                >
                    <span style={{ color: '#FF5722' }}>🔥</span> {viewers} viendo ahora
                </motion.div>
            </div>

            {/* Info */}
            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                    {producto.categoriaNombre || 'Sin categoría'}
                </p>
                <Link to={`/producto/${producto.id}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: 1.35 }}>
                        {producto.nombre}
                    </h3>
                </Link>

                {/* Barra de stock vendido */}
                <div className="scarcity-bar">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            Disponibilidad
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: pct >= 85 ? '#FF5722' : 'var(--color-text-muted)' }}>
                            {pct}% vendido
                        </span>
                    </div>
                    <div className="stock-bar-track">
                        <motion.div
                            className="stock-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1.2, delay: index * 0.05, ease: 'easeOut' }}
                            style={{ background: pct >= 85 ? 'var(--color-primary)' : pct >= 65 ? '#FEE715' : 'var(--color-success)' }}
                        />
                    </div>
                    {producto.stock <= 10 && (
                        <p style={{ fontSize: '0.68rem', color: '#FF5722', fontWeight: 700, marginTop: 4 }}>
                            ⚡ ¡Solo quedan {producto.stock} unidades!
                        </p>
                    )}
                </div>

                {/* Precio + CTA */}
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                    <div>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.25rem', color: 'var(--color-text)' }}>
                            {formatCOP(producto.precio)}
                        </span>
                    </div>
                    {/* Botón CTA Naranja — Efecto Restorff */}
                    <motion.button
                        whileHover={{ scale: 1.08, boxShadow: '0 6px 20px rgba(255,87,34,0.5)' }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => addItem(producto)}
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 800 }}
                    >
                        <ShoppingCart size={14} /> Añadir
                    </motion.button>
                </div>

                {/* Texto de urgencia social */}
                {viewers > 30 && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={11} style={{ color: '#FEE715' }} />
                        <span>Únete a los <strong style={{ color: 'var(--color-text)' }}>+{Math.floor(viewers * 8)}</strong> que ya lo tienen</span>
                    </p>
                )}
            </div>
        </motion.div>
    )
}
