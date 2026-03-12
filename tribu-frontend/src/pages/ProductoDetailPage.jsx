import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProductoById } from '../api'
import { useCart } from '../context/CartContext'
import { motion } from 'framer-motion'
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProductoDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { addItem } = useCart()

    const [producto, setProducto] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cantidad, setCantidad] = useState(1)

    // Estado para el zoom tipo MercadoLibre
    const [isZooming, setIsZooming] = useState(false)
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
    const imageRef = useRef(null)

    useEffect(() => {
        const fetchProducto = async () => {
            try {
                setLoading(true)
                const res = await getProductoById(id)
                setProducto(res.data)
            } catch (err) {
                console.error("Error cargando producto:", err)
                setError("El producto no existe o está agotado.")
            } finally {
                setLoading(false)
            }
        }
        fetchProducto()
    }, [id])

    const formatCOP = (n) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

    const handleAddToCart = () => {
        if (producto && producto.stock > 0) {
            if (cantidad > producto.stock) {
                toast.error(`Solo hay ${producto.stock} unidades disponibles`)
                return
            }
            addItem(producto, cantidad)
            // Ya hay un toast en CartContext, no necesitamos otro aquí
        }
    }

    const handleMouseMove = (e) => {
        if (!imageRef.current) return

        const { left, top, width, height } = imageRef.current.getBoundingClientRect()

        // Calcular porcentaje de posición (0 a 100)
        const x = ((e.clientX - left) / width) * 100
        const y = ((e.clientY - top) / height) * 100

        setZoomPosition({ x, y })
    }

    if (loading) {
        return (
            <div style={{ paddingTop: '6rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '3rem', height: '3rem', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (error || !producto) {
        return (
            <div style={{ paddingTop: '6rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{error}</h2>
                <button
                    onClick={() => navigate('/')}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1.5rem', fontWeight: 'bold' }}
                >
                    Volver al Inicio
                </button>
            </div>
        )
    }

    return (
        <div style={{ paddingTop: '5rem', paddingBottom: '4rem', minHeight: '100vh', color: 'var(--color-text)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>

                {/* Botón Volver */}
                <button
                    onClick={() => navigate(-1)}
                    style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '2rem', transition: 'color 0.2s', fontSize: '1rem' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                >
                    <ArrowLeft size={20} style={{ marginRight: '0.5rem' }} />
                    Volver
                </button>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>

                    {/* Columna Izquierda: Imagen con Zoom */}
                    <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div
                            ref={imageRef}
                            onMouseEnter={() => setIsZooming(true)}
                            onMouseLeave={() => setIsZooming(false)}
                            onMouseMove={handleMouseMove}
                            style={{
                                position: 'relative',
                                width: '100%',
                                aspectRatio: '1/1',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                cursor: 'crosshair',
                            }}
                        >
                            <img
                                src={producto.imagenUrl || 'https://via.placeholder.com/600'}
                                alt={producto.nombre}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isZooming ? 0 : 1, transition: 'opacity 0.3s' }}
                            />

                            {/* Capa de Zoom */}
                            {isZooming && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        pointerEvents: 'none',
                                        backgroundImage: `url(${producto.imagenUrl || 'https://via.placeholder.com/600'})`,
                                        backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                        backgroundSize: '250%', // Nivel de zoom
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                />
                            )}
                        </div>
                        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>
                            Pasa el cursor sobre la imagen para hacer zoom
                        </p>
                    </div>

                    {/* Columna Derecha: Detalles del Producto */}
                    <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                                {producto.categoria?.nombre || 'General'}
                            </span>
                        </div>

                        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>
                            {producto.nombre}
                        </h1>

                        <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
                            {formatCOP(producto.precio)}
                        </div>

                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                            {producto.descripcion}
                        </p>

                        {/* Selector de Cantidad y Botón */}
                        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', width: '120px' }}>
                                    <button
                                        onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                        style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
                                    >
                                        -
                                    </button>
                                    <span style={{ fontWeight: 'bold' }}>{cantidad}</span>
                                    <button
                                        onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                                        style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
                                    >
                                        +
                                    </button>
                                </div>

                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    {producto.stock} disponibles
                                </p>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={producto.stock === 0}
                                className={producto.stock > 0 ? "btn btn-primary" : ""}
                                style={{
                                    width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem',
                                    ...(producto.stock === 0 ? { background: '#333', color: '#888', cursor: 'not-allowed', border: 'none', borderRadius: 'var(--radius-md)' } : {})
                                }}
                            >
                                <ShoppingCart size={20} style={{ marginRight: '0.5rem' }} />
                                {producto.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                            </button>
                        </div>

                        {/* Beneficios (Tipo MercadoLibre) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Truck size={24} style={{ color: 'var(--color-success)', marginRight: '0.75rem', flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <h4 style={{ fontWeight: 'bold', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Envíos a todo el país</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Despachamos de manera rápida y segura.</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                <RotateCcw size={24} style={{ color: '#4facfe', marginRight: '0.75rem', flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <h4 style={{ fontWeight: 'bold', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Devolución gratis</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tienes 30 días desde que lo recibes.</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                <ShieldCheck size={24} style={{ color: '#FEE715', marginRight: '0.75rem', flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <h4 style={{ fontWeight: 'bold', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Compra Protegida</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Recibe el producto que esperabas o te devolvemos tu dinero.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
