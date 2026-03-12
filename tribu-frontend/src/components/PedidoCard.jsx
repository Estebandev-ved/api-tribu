import { useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Truck, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'

const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const estadoConfig = {
    PENDIENTE: { icon: <Clock size={16} />, color: 'var(--color-warning)', label: 'Pendiente' },
    PAGADO: { icon: <CheckCircle size={16} />, color: 'var(--color-success)', label: 'Pagado' },
    ENVIADO: { icon: <Truck size={16} />, color: 'var(--color-primary-light)', label: 'Enviado' },
    ENTREGADO: { icon: <Package size={16} />, color: 'var(--color-success)', label: 'Entregado' },
}

export default function PedidoCard({ pedido, index = 0 }) {
    const [expanded, setExpanded] = useState(false)
    const config = estadoConfig[pedido.estado] || estadoConfig.PENDIENTE

    return (
        <motion.div
            className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem' }}>Pedido #{pedido.id}</span>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '3px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700,
                            background: config.color + '20', color: config.color, border: `1px solid ${config.color}40`,
                        }}>
                            {config.icon} {config.label}
                        </span>
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        📅 {new Date(pedido.fechaPedido).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        📍 {pedido.direccionEnvio}
                    </p>
                    {pedido.guiaRastreo && (
                        <p style={{ color: 'var(--color-primary-light)', fontSize: '0.85rem', marginTop: '0.25rem', fontWeight: 600 }}>
                            🚚 Guía: {pedido.guiaRastreo}
                        </p>
                    )}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-primary-light)' }}>
                        {formatCOP(pedido.total)}
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{pedido.detalles.length} producto(s)</p>
                </div>
            </div>

            {/* Progress bar de estado */}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '4px' }}>
                {['PENDIENTE', 'PAGADO', 'ENVIADO', 'ENTREGADO'].map((e, i) => {
                    const estadosOrden = ['PENDIENTE', 'PAGADO', 'ENVIADO', 'ENTREGADO']
                    const activo = estadosOrden.indexOf(pedido.estado) >= i
                    return (
                        <div key={e} style={{ flex: 1, height: 4, borderRadius: 2, background: activo ? config.color : 'var(--color-border)', transition: 'background 0.4s' }} />
                    )
                })}
            </div>

            {/* Expandir detalles */}
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    marginTop: '1rem', background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 500,
                }}
            >
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {expanded ? 'Ocultar' : 'Ver'} productos
            </button>

            {/* Listado de Productos */}
            {expanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    style={{ overflow: 'hidden', marginTop: '1rem' }}
                >
                    {pedido.detalles.map(d => (
                        <div key={d.id} style={{
                            display: 'flex', gap: '0.75rem', padding: '0.75rem',
                            background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)',
                            marginBottom: '0.5rem', alignItems: 'center',
                        }}>
                            <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--color-bg)', flexShrink: 0 }}>
                                {d.productoImagenUrl
                                    ? <img src={d.productoImagenUrl} alt={d.productoNombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.2rem' }}>🛍️</div>
                                }
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.productoNombre}</p>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>x{d.cantidad} · {formatCOP(d.precioUnitario)} c/u</p>
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--color-primary-light)', fontSize: '0.9rem' }}>
                                {formatCOP(d.subtotal)}
                            </span>
                        </div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    )
}
