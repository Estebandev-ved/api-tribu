import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { crearPedido, validarCupon } from '../api'
import toast from 'react-hot-toast'
import { useNotification } from '../context/NotificationContext';
import { MapPin, CheckCircle, ShoppingBag, Mail } from 'lucide-react'
import MetodosDePago from '../components/MetodosDePago';

const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const colombiaData = [
    {
        departamento: 'Antioquia',
        ciudades: [
            { name: 'Medellín', region: 'local' },
            { name: 'Envigado', region: 'local' },
            { name: 'Itagüí', region: 'local' },
            { name: 'Sabaneta', region: 'local' },
            { name: 'Bello', region: 'local' },
            { name: 'La Estrella', region: 'local' },
            { name: 'Caldas', region: 'local' },
            { name: 'Copacabana', region: 'local' },
            { name: 'Rionegro', region: 'regional' },
            { name: 'Apartadó', region: 'regional' },
            { name: 'Caucasia', region: 'regional' },
            { name: 'Marinilla', region: 'regional' },
            { name: 'Guarne', region: 'regional' },
            { name: 'Turbo', region: 'regional' },
            { name: 'Chigorodó', region: 'regional' },
            { name: 'El Carmen de Viboral', region: 'regional' },
            { name: 'La Ceja', region: 'regional' },
            { name: 'Barbosa', region: 'regional' }
        ]
    },
    {
        departamento: 'Cundinamarca',
        ciudades: [
            { name: 'Bogotá D.C.', region: 'principal' },
            { name: 'Soacha', region: 'principal' },
            { name: 'Chía', region: 'regional' },
            { name: 'Facatativá', region: 'regional' },
            { name: 'Girardot', region: 'regional' },
            { name: 'Zipaquirá', region: 'regional' },
            { name: 'Fusagasugá', region: 'regional' },
            { name: 'Mosquera', region: 'regional' },
            { name: 'Funza', region: 'regional' },
            { name: 'Madrid', region: 'regional' },
            { name: 'Cajicá', region: 'regional' },
            { name: 'Tocancipá', region: 'regional' },
            { name: 'Sopó', region: 'regional' },
            { name: 'La Mesa', region: 'regional' },
            { name: 'Villeta', region: 'regional' }
        ]
    },
    {
        departamento: 'Valle del Cauca',
        ciudades: [
            { name: 'Cali', region: 'principal' },
            { name: 'Palmira', region: 'principal' },
            { name: 'Buenaventura', region: 'nacional' },
            { name: 'Buga', region: 'nacional' },
            { name: 'Tuluá', region: 'nacional' },
            { name: 'Cartago', region: 'nacional' },
            { name: 'Yumbo', region: 'principal' },
            { name: 'Jamundí', region: 'principal' },
            { name: 'Candelaria', region: 'principal' },
            { name: 'Florida', region: 'nacional' }
        ]
    },
    {
        departamento: 'Atlántico',
        ciudades: [
            { name: 'Barranquilla', region: 'principal' },
            { name: 'Soledad', region: 'principal' },
            { name: 'Sabanalarga', region: 'nacional' },
            { name: 'Malambo', region: 'principal' },
            { name: 'Baranoa', region: 'nacional' },
            { name: 'Santo Tomás', region: 'nacional' }
        ]
    },
    {
        departamento: 'Santander',
        ciudades: [
            { name: 'Bucaramanga', region: 'principal' },
            { name: 'Floridablanca', region: 'principal' },
            { name: 'Barrancabermeja', region: 'nacional' },
            { name: 'San Gil', region: 'nacional' },
            { name: 'Girón', region: 'principal' },
            { name: 'Piedecuesta', region: 'principal' },
            { name: 'Socorro', region: 'nacional' },
            { name: 'Vélez', region: 'nacional' }
        ]
    },
    {
        departamento: 'Bolívar',
        ciudades: [
            { name: 'Cartagena', region: 'principal' },
            { name: 'Magangué', region: 'nacional' },
            { name: 'Turbaco', region: 'principal' },
            { name: 'El Carmen de Bolívar', region: 'nacional' }
        ]
    },
    {
        departamento: 'Risaralda',
        ciudades: [
            { name: 'Pereira', region: 'principal' },
            { name: 'Dosquebradas', region: 'principal' },
            { name: 'Santa Rosa de Cabal', region: 'nacional' },
            { name: 'La Virginia', region: 'nacional' }
        ]
    },
    {
        departamento: 'Caldas',
        ciudades: [
            { name: 'Manizales', region: 'principal' },
            { name: 'Villamaría', region: 'principal' },
            { name: 'La Dorada', region: 'nacional' },
            { name: 'Chinchiná', region: 'regional' }
        ]
    },
    {
        departamento: 'Quindío',
        ciudades: [
            { name: 'Armenia', region: 'principal' },
            { name: 'Calarcá', region: 'principal' },
            { name: 'Montenegro', region: 'regional' },
            { name: 'La Tebaida', region: 'regional' }
        ]
    },
    {
        departamento: 'Tolima',
        ciudades: [
            { name: 'Ibagué', region: 'principal' },
            { name: 'Espinal', region: 'nacional' },
            { name: 'Melgar', region: 'nacional' },
            { name: 'Honda', region: 'nacional' },
            { name: 'Líbano', region: 'nacional' }
        ]
    },
    {
        departamento: 'Huila',
        ciudades: [
            { name: 'Neiva', region: 'principal' },
            { name: 'Pitalito', region: 'nacional' },
            { name: 'Garzón', region: 'nacional' },
            { name: 'La Plata', region: 'nacional' }
        ]
    },
    {
        departamento: 'Norte de Santander',
        ciudades: [
            { name: 'Cúcuta', region: 'principal' },
            { name: 'Ocaña', region: 'nacional' },
            { name: 'Villa del Rosario', region: 'principal' },
            { name: 'Los Patios', region: 'principal' },
            { name: 'Pamplona', region: 'nacional' }
        ]
    },
    {
        departamento: 'Meta',
        ciudades: [
            { name: 'Villavicencio', region: 'principal' },
            { name: 'Acacías', region: 'nacional' },
            { name: 'Granada', region: 'nacional' }
        ]
    },
    {
        departamento: 'Nariño',
        ciudades: [
            { name: 'Pasto', region: 'principal' },
            { name: 'Ipiales', region: 'nacional' },
            { name: 'Tumaco', region: 'especial' },
            { name: 'Túquerres', region: 'nacional' }
        ]
    },
    {
        departamento: 'Córdoba',
        ciudades: [
            { name: 'Montería', region: 'principal' },
            { name: 'Cereté', region: 'nacional' },
            { name: 'Lorica', region: 'nacional' },
            { name: 'Sahagún', region: 'nacional' }
        ]
    },
    {
        departamento: 'Magdalena',
        ciudades: [
            { name: 'Santa Marta', region: 'principal' },
            { name: 'Ciénaga', region: 'nacional' },
            { name: 'Fundación', region: 'nacional' }
        ]
    },
    {
        departamento: 'Cesar',
        ciudades: [
            { name: 'Valledupar', region: 'principal' },
            { name: 'Aguachica', region: 'nacional' },
            { name: 'Bosconia', region: 'nacional' }
        ]
    },
    {
        departamento: 'Boyacá',
        ciudades: [
            { name: 'Tunja', region: 'principal' },
            { name: 'Duitama', region: 'nacional' },
            { name: 'Sogamoso', region: 'nacional' },
            { name: 'Chiquinquirá', region: 'nacional' },
            { name: 'Paipa', region: 'nacional' }
        ]
    },
    {
        departamento: 'Sucre',
        ciudades: [
            { name: 'Sincelejo', region: 'principal' },
            { name: 'Corozal', region: 'nacional' },
            { name: 'Sampués', region: 'nacional' }
        ]
    },
    {
        departamento: 'Cauca',
        ciudades: [
            { name: 'Popayán', region: 'principal' },
            { name: 'Santander de Quilichao', region: 'nacional' },
            { name: 'Puerto Tejada', region: 'nacional' }
        ]
    },
    {
        departamento: 'Putumayo',
        ciudades: [
            { name: 'Mocoa', region: 'especial' },
            { name: 'Puerto Asís', region: 'especial' },
            { name: 'Orito', region: 'especial' }
        ]
    },
    {
        departamento: 'Caquetá',
        ciudades: [
            { name: 'Florencia', region: 'especial' },
            { name: 'San Vicente del Caguán', region: 'especial' }
        ]
    },
    {
        departamento: 'Casanare',
        ciudades: [
            { name: 'Yopal', region: 'nacional' },
            { name: 'Aguazul', region: 'nacional' }
        ]
    },
    {
        departamento: 'Arauca',
        ciudades: [
            { name: 'Arauca', region: 'especial' },
            { name: 'Saravena', region: 'especial' }
        ]
    },
    {
        departamento: 'La Guajira',
        ciudades: [
            { name: 'Riohacha', region: 'nacional' },
            { name: 'Maicao', region: 'nacional' }
        ]
    },
    {
        departamento: 'Guainía',
        ciudades: [
            { name: 'Inírida', region: 'especial' }
        ]
    },
    {
        departamento: 'Vaupés',
        ciudades: [
            { name: 'Mitú', region: 'especial' }
        ]
    },
    {
        departamento: 'Vichada',
        ciudades: [
            { name: 'Puerto Carreño', region: 'especial' }
        ]
    },
    {
        departamento: 'Guaviare',
        ciudades: [
            { name: 'San José del Guaviare', region: 'especial' }
        ]
    },
    {
        departamento: 'Amazonas',
        ciudades: [
            { name: 'Leticia', region: 'especial' }
        ]
    },
    {
        departamento: 'San Andrés y Providencia',
        ciudades: [
            { name: 'San Andrés', region: 'especial' }
        ]
    },
    {
        departamento: 'Chocó',
        ciudades: [
            { name: 'Quibdó', region: 'especial' },
            { name: 'Istmina', region: 'especial' }
        ]
    }
];


const selectStyle = {
    width: '100%',
    // Fondo y color explícitos para que funcione en desktop (Chrome/Edge/Firefox)
    // Los <select> nativos en Windows heredan el color del OS, no del CSS del contenedor
    background: '#1a1a2e',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    padding: '0.8rem 2.5rem 0.8rem 1.2rem',
    borderRadius: '10px',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.7)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    };

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart()
    const { isAuthenticated, user } = useAuth()
    const hasTribuPass = user?.tribuPassActiva === true;
    const navigate = useNavigate()
    const { agregarNuevaNotificacion } = useNotification();
    const [direccion, setDireccion] = useState('')
    const [departamento, setDepartamento] = useState('')
    const [ciudad, setCiudad] = useState('')
    const [direccionDetalle, setDireccionDetalle] = useState('')
    const [barrio, setBarrio] = useState('')
    const [selectedRegion, setSelectedRegion] = useState('nacional')
    const [otroDepartamento, setOtroDepartamento] = useState('')
    const [otraCiudad, setOtraCiudad] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const parts = [];
        if (direccionDetalle) parts.push(direccionDetalle);
        if (barrio) parts.push(`Barrio: ${barrio}`);
        const cName = departamento === 'Otro' ? otraCiudad : ciudad;
        const dName = departamento === 'Otro' ? otroDepartamento : departamento;
        if (cName) parts.push(cName);
        if (dName) parts.push(dName);
        setDireccion(parts.join(', '));
    }, [direccionDetalle, barrio, ciudad, departamento, otraCiudad, otroDepartamento]);
    const [pedidoCreado, setPedidoCreado] = useState(null)
    const [codigoCupon, setCodigoCupon] = useState('')
    const [cuponAplicado, setCuponAplicado] = useState(null)
    const [validandoCupon, setValidandoCupon] = useState(false)

    const handleValidarCupon = async () => {
        if (!codigoCupon) return;
        setValidandoCupon(true);
        try {
            const res = await validarCupon(codigoCupon, total);
            if (res.data.valido) {
                setCuponAplicado(res.data);
                toast.success('¡Cupón aplicado!');
            } else {
                setCuponAplicado(null);
                toast.error(res.data.error || 'Cupón inválido');
            }
        } catch (error) {
            toast.error('Error al validar cupón');
        } finally {
            setValidandoCupon(false);
        }
    }

    const totalFinal = cuponAplicado ? Math.max(0, total - cuponAplicado.descuento) : total;

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
                    <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                        <Mail size={16} style={{ color: 'var(--color-primary-light)' }} />
                        Recibirás un email de confirmación en breve. Te avisaremos en cada paso del envío.
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
            </motion.h1>            {/* Multi-step Progress Bar */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '2.5rem',
                background: 'var(--color-surface-2)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', alignItems: 'center' }}>
                    {/* Line Background */}
                    <div style={{
                        position: 'absolute',
                        left: '5%',
                        right: '5%',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: '4px',
                        background: 'var(--color-border)',
                        zIndex: 1,
                        borderRadius: '2px',
                        overflow: 'hidden'
                    }}>
                        {/* Progress Fill */}
                        <div 
                            className="progress-fill"
                            style={{
                                height: '100%',
                                width: '100%',
                                transform: direccion ? 'scaleX(1)' : 'scaleX(0.5)',
                                transformOrigin: 'left',
                                background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
                                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        />
                    </div>

                    {/* Step 1: Carrito */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, gap: '4px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: 'var(--color-primary)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.85rem',
                            boxShadow: 'var(--shadow-orange)',
                            border: '2px solid var(--color-bg)'
                        }}>
                            ✓
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>Carrito</span>
                    </div>

                    {/* Step 2: Envío */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, gap: '4px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: direccion ? 'var(--color-primary)' : 'var(--color-surface-3)',
                            color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.85rem',
                            border: direccion ? '2px solid var(--color-bg)' : '2px solid var(--color-border)',
                            boxShadow: direccion ? 'var(--shadow-orange)' : 'none',
                            transition: 'all 0.3s ease'
                        }}>
                            {direccion ? '✓' : '2'}
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: direccion ? 'var(--color-text)' : 'var(--color-text-muted)' }}>Envío</span>
                    </div>

                    {/* Step 3: Pago */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, gap: '4px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: direccion ? 'var(--color-accent)' : 'var(--color-surface-3)',
                            color: direccion ? '#111' : '#555',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.85rem',
                            border: direccion ? '2px solid var(--color-bg)' : '2px solid var(--color-border)',
                            boxShadow: direccion ? 'var(--shadow-yellow)' : 'none',
                            transition: 'all 0.3s ease'
                        }}>
                            3
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: direccion ? 'var(--color-accent)' : 'var(--color-text-faint)' }}>Pago</span>
                    </div>
                </div>
            </div>

            {/* Banner de aviso de demora por alta demanda */}
            <div style={{
                background: 'rgba(255, 87, 34, 0.08)',
                border: '1px solid rgba(255, 87, 34, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
            }}>
                <Truck size={24} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <div style={{ fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--color-text)' }}>
                    🚚 <strong>AVISO DE ENTREGA:</strong> Debido a la alta demanda de nuestros productos virales, el tiempo estimado de entrega a nivel nacional es de <strong>4 a 6 días hábiles</strong>. ¡Tu pedido está 100% garantizado!
                </div>
            </div>

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
                        
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                                Departamento *
                            </label>
                            <select 
                                style={selectStyle}
                                value={departamento} 
                                onChange={(e) => {
                                    const depto = e.target.value;
                                    setDepartamento(depto);
                                    setCiudad('');
                                    setOtraCiudad('');
                                    setOtroDepartamento('');
                                    setSelectedRegion('nacional');
                                }}
                            >
                                <option value="" disabled>Seleccione un departamento...</option>
                                {colombiaData.map(d => (
                                    <option key={d.departamento} value={d.departamento}>{d.departamento}</option>
                                ))}
                                <option value="Otro">Otro (Ingresar manualmente)</option>
                            </select>
                        </div>

                        {departamento === 'Otro' && (
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Nombre del Departamento *</label>
                                <input 
                                    type="text"
                                    className="tribu-input"
                                    placeholder="Ej: Putumayo"
                                    value={otroDepartamento}
                                    onChange={(e) => setOtroDepartamento(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {departamento && departamento !== 'Otro' && (
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Ciudad / Municipio *</label>
                                <select 
                                    style={selectStyle}
                                    value={ciudad} 
                                    onChange={(e) => {
                                        const cityName = e.target.value;
                                        setCiudad(cityName);
                                        const deptoObj = colombiaData.find(d => d.departamento === departamento);
                                        const cityObj = deptoObj?.ciudades.find(c => c.name === cityName);
                                        setSelectedRegion(cityObj?.region || 'nacional');
                                    }}
                                >
                                    <option value="" disabled>Seleccione una ciudad...</option>
                                    {colombiaData.find(d => d.departamento === departamento)?.ciudades.map(c => (
                                        <option key={c.name} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {departamento === 'Otro' && (
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Nombre de la Ciudad *</label>
                                <input 
                                    type="text"
                                    className="tribu-input"
                                    placeholder="Ej: Mocoa"
                                    value={otraCiudad}
                                    onChange={(e) => {
                                        setOtraCiudad(e.target.value);
                                        setSelectedRegion('nacional');
                                    }}
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Dirección (Calle, Carrera, Número, Apto/Casa) *</label>
                            <input 
                                type="text"
                                className="tribu-input"
                                placeholder="Ej: Calle 10 #43a-30 Apto 402"
                                value={direccionDetalle}
                                onChange={(e) => setDireccionDetalle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Barrio / Indicaciones adicionales (Opcional)</label>
                            <input 
                                type="text"
                                className="tribu-input"
                                placeholder="Ej: Barrio El Poblado, portón verde"
                                value={barrio}
                                onChange={(e) => setBarrio(e.target.value)}
                            />
                        </div>

                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input 
                                    className="tribu-input" 
                                    placeholder="Código de cupón"
                                    value={codigoCupon}
                                    onChange={e => setCodigoCupon(e.target.value.toUpperCase())}
                                    style={{ flex: 1, padding: '0.6rem 1rem' }}
                                />
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={handleValidarCupon}
                                    disabled={validandoCupon}
                                    style={{ whiteSpace: 'nowrap', padding: '0.6rem 1.2rem' }}
                                >
                                    {validandoCupon ? '...' : 'Validar'}
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
                                <span>{formatCOP(total)}</span>
                            </div>
                            {cuponAplicado && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--color-success)' }}>
                                    <span>Descuento ({cuponAplicado.codigo})</span>
                                    <span>-{formatCOP(cuponAplicado.descuento)}</span>
                                </div>
                            )}
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Envío</span>
                                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                                    {hasTribuPass ? 'Gratis con Tribu Pass 💎' : 'Calculado al despachar'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary-light)', marginTop: '0.75rem' }}>
                                <span>Total</span>
                                <span>{formatCOP(totalFinal)}</span>
                            </div>
                        </div>

                        {/* Nuevo componente de métodos de pago */}
                        {(() => {
                            const isDireccionValida = !!(
                                direccionDetalle.trim() &&
                                departamento &&
                                (departamento === 'Otro' ? (otroDepartamento.trim() && otraCiudad.trim()) : ciudad)
                            );
                            return (
                                <MetodosDePago 
                                    total={formatCOP(totalFinal)} 
                                    totalNumber={totalFinal}
                                    direccionEnvio={direccion}
                                    cuponCodigo={cuponAplicado?.codigo}
                                    shippingRegion={selectedRegion}
                                    isDireccionValida={isDireccionValida}
                                />
                            );
                        })()}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
