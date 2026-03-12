import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { crearPedido } from '../api'
import toast from 'react-hot-toast'
import { useNotification } from '../context/NotificationContext';
import { MapPin, CheckCircle, ShoppingBag } from 'lucide-react'

const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

import MetodosDePago from '../components/MetodosDePago';

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart()
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const { agregarNuevaNotificacion } = useNotification();
    const [direccion, setDireccion] = useState('')
    const [loading, setLoading] = useState(false)
    const [pedidoCreado, setPedidoCreado] = useState(null)

    if (!isAuthenticated) { navigate('/login'); return null }

    if (items.length === 0 && !pedidoCreado) {
        return (
            <div className="empty-state" style={{ padding: '5rem' }}>
                <ShoppingBag size={64} />
                <p style={{ marginTop: '1rem' }}>Tu carrito está vacío</p>
                <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/')}>
                    Ir a la tienda
                </button>
            </div>
        )
    }

    // Success state
    if (pedidoCreado) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: 480, width: '100%' }}
                >
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        style={{ display: 'inline-flex', background: 'rgba(16,185,129,0.15)', borderRadius: '50%', padding: '1.5rem', marginBottom: '1.5rem' }}
                    >
                        <CheckCircle size={52} color="var(--color-success)" />
                    </motion.div>
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.8rem', marginBottom: '1rem' }}>
                        ¡Pedido Confirmado!
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                        Tu pedido <strong style={{ color: 'var(--color-primary-light)' }}>#{pedidoCreado.id}</strong> fue registrado exitosamente.
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                        📧 Recibirás un email de confirmación en breve. Te avisaremos en cada paso del envío.
                    </p>
                    <div style={{
                        background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)',
                        padding: '1rem', marginBottom: '2rem', textAlign: 'left',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Total</span>
                            <span style={{ fontWeight: 800, color: 'var(--color-primary-light)' }}>{formatCOP(pedidoCreado.total)}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={() => navigate('/mis-pedidos')}>Ver mis pedidos</button>
                        <button className="btn btn-ghost" onClick={() => navigate('/')}>Seguir comprando</button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 900 }}>
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="page-title" style={{ marginBottom: '2rem' }}>
                Finalizar Compra
            </motion.h1>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', 
                gap: '2rem' 
            }}>
                {/* Resumen */}
                <div>
                    <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>Resumen del pedido</h2>
                    {items.map((item, i) => (
                        <motion.div key={item.id}
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                            style={{
                                display: 'flex', gap: '1rem', padding: '1rem',
                                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)', marginBottom: '0.75rem',
                            }}
                        >
                            <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', background: 'var(--color-surface-2)', flexShrink: 0 }}>
                                {item.imagenUrl
                                    ? <img src={item.imagenUrl} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.4rem' }}>🛍️</div>
                                }
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{item.nombre}</p>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Cantidad: {item.cantidad}</p>
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>
                                {formatCOP(item.precio * item.cantidad)}
                            </span>
                        </motion.div>
                    ))}
                </div>

                {/* Formulario y Pago */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                    <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '80px' }}>
                        <h2 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Datos de envío</h2>
                        
                        <div className="form-group">
                            <label><MapPin size={14} style={{ marginRight: 4 }} />Dirección de envío</label>
                            <textarea 
                                className="tribu-input" 
                                rows={3} 
                                placeholder="Ej: Calle 15 #23-45, Barrio Centro, Mocoa, Putumayo"
                                value={direccion} 
                                onChange={e => setDireccion(e.target.value)} 
                                style={{ resize: 'none' }} 
                            />
                        </div>

                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Subtotal ({items.length} productos)</span>
                                <span>{formatCOP(total)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Envío</span>
                                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Calculado al despachar</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary-light)', marginTop: '0.75rem' }}>
                                <span>Total</span>
                                <span>{formatCOP(total)}</span>
                            </div>
                        </div>

                        {/* Nuevo componente de métodos de pago */}
                        <MetodosDePago 
                            total={formatCOP(total)} 
                            direccionEnvio={direccion}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
