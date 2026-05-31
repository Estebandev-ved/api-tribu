import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProductoById } from '../api'
import { useCart } from '../context/CartContext'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react'
import OptimizedImage from '../components/OptimizedImage'
import toast from 'react-hot-toast'

export default function ProductoDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { addItem } = useCart()

    const [producto, setProducto] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cantidad, setCantidad] = useState(1)
    const [activeImage, setActiveImage] = useState(null)

    // Estado para el zoom tipo MercadoLibre
    const [isZooming, setIsZooming] = useState(false)
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
    const imageRef = useRef(null)

    // Tarea 5: Botón de Compra Persistente (Sticky Add to Cart)
    const [showSticky, setShowSticky] = useState(false)
    const mainButtonRef = useRef(null)

    useEffect(() => {
        if (producto) {
            setActiveImage(producto.imagenUrl)
        }
    }, [producto])

    useEffect(() => {
        if (!producto || producto.stock === 0) return

        const observer = new IntersectionObserver(([entry]) => {
            setShowSticky(!entry.isIntersecting)
        }, { threshold: 0 })

        if (mainButtonRef.current) {
            observer.observe(mainButtonRef.current)
        }

        return () => observer.disconnect()
    }, [producto])

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

                    {/* Columna Izquierda: Imagen con Zoom y Galería */}
                    <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Contenedor cuadrado estable para navegadores móviles y desktop */}
                        <div style={{ position: 'relative', width: '100%', paddingTop: '100%' }}>
                            <div
                                ref={imageRef}
                                onMouseEnter={() => setIsZooming(true)}
                                onMouseLeave={() => setIsZooming(false)}
                                onMouseMove={handleMouseMove}
                                style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    borderRadius: 'var(--radius-lg)',
                                    overflow: 'hidden',
                                    background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border)',
                                    cursor: 'crosshair',
                                }}
                            >
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: isZooming ? 0 : 1, transition: 'opacity 0.3s' }}>
                                    <OptimizedImage
                                        src={activeImage || producto.imagenUrl}
                                        alt={producto.nombre}
                                        fallback="📦"
                                        eager={true}
                                    />
                                </div>

                                {/* Capa de Zoom */}
                                {isZooming && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            pointerEvents: 'none',
                                            backgroundImage: `url(${activeImage || producto.imagenUrl || 'https://via.placeholder.com/600'})`,
                                            backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                            backgroundSize: '250%', // Nivel de zoom
                                            backgroundRepeat: 'no-repeat'
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Miniaturas de Perspectivas */}
                        {(() => {
                            const imagesList = producto?.imagenesAdicionales
                                ? [producto.imagenUrl, ...producto.imagenesAdicionales.split(',').map(img => img.trim()).filter(Boolean)]
                                : [producto?.imagenUrl].filter(Boolean);

                            return imagesList.length > 1 && (
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                    {imagesList.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(img)}
                                            onMouseEnter={() => setActiveImage(img)}
                                            style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: 'var(--radius-md)',
                                                overflow: 'hidden',
                                                border: (activeImage || producto.imagenUrl) === img ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                background: 'var(--color-surface)',
                                                padding: 0,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                transform: (activeImage || producto.imagenUrl) === img ? 'scale(1.05)' : 'none',
                                                boxShadow: (activeImage || producto.imagenUrl) === img ? '0 0 8px rgba(255, 87, 34, 0.4)' : 'none'
                                            }}
                                        >
                                            <img src={img} alt={`Perspective ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </button>
                                    ))}
                                </div>
                            );
                        })()}

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
                                ref={mainButtonRef}
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

                            {/* Banner de aviso de demora por alta demanda */}
                            {producto.stock > 0 && (
                                <div style={{
                                    background: 'rgba(255, 87, 34, 0.08)',
                                    border: '1px solid rgba(255, 87, 34, 0.25)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.85rem 1rem',
                                    marginTop: '1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                }}>
                                    <Truck size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                                    <div style={{ fontSize: '0.8rem', lineHeight: 1.45, color: 'var(--color-text)' }}>
                                        🔥 <strong>Alta demanda:</strong> Los pedidos tardan de <strong>4 a 6 días hábiles</strong> en llegar a tu puerta. ¡Gracias por tu paciencia!
                                    </div>
                                </div>
                            )}

                            {/* Tarea 7: Sellos de Garantía Visuales Integrados */}
                            {producto.stock > 0 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginTop: '1.25rem',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid var(--color-border)',
                                    gap: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                        <ShieldCheck size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                                        <span>Garantía de 30 días</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                        <Truck size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                                        <span>Envío Seguro</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                        <RotateCcw size={14} style={{ color: '#4facfe', flexShrink: 0 }} />
                                        <span>Devolución Gratis</span>
                                    </div>
                                </div>
                            )}
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

            {/* Sticky Mobile Add to Cart (Tarea 5) */}
            <AnimatePresence>
                {showSticky && producto && producto.stock > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        style={{
                            position: 'fixed',
                            bottom: 0, left: 0, right: 0,
                            background: 'rgba(26, 26, 26, 0.95)',
                            backdropFilter: 'blur(12px)',
                            borderTop: '1px solid rgba(255, 87, 34, 0.2)',
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            zIndex: 999,
                            boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
                        }}
                        className="mobile-sticky-buy"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--color-surface-2)', flexShrink: 0 }}>
                                <OptimizedImage src={producto.imagenUrl} alt={producto.nombre} fallback="📦" />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {producto.nombre}
                                </p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 800, margin: 0 }}>
                                    {formatCOP(producto.precio)}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            className="btn btn-primary"
                            style={{
                                padding: '0.5rem 1.2rem',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <ShoppingCart size={14} />
                            Añadir
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
