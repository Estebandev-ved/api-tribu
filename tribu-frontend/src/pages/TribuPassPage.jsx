import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Gem, Zap, Truck, Star, 
    Calendar, AlertCircle, CheckCircle2, XCircle, 
    ArrowRight, RefreshCcw, ShieldCheck,
    History, TrendingUp, Package,
    Lock, Clock, Headphones, Globe, 
    Sparkles, Crown, BadgeCheck,
    Calculator, Rocket, Wallet,
    HelpCircle, Quote,
    Minus, Plus
} from 'lucide-react'
import { 
    getTribuPassEstado, 
    activarTribuPass, 
    cancelarTribuPass, 
    actualizarRenovacionAutomatica, 
    getTribuPassHistorial,
    getTribuPassBeneficios,
    syncEfipayTribuPass
} from '../api'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const formatCurrency = (monto) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto || 0);

const trustItems = [
    { icon: <Lock size={20} />, title: 'Pago 100% Seguro', desc: 'Cifrado SSL + métodos verificados' },
    { icon: <ShieldCheck size={20} />, title: 'Garantía de Servicio', desc: 'Tu dinero siempre protegido' },
    { icon: <Clock size={20} />, title: 'Sin Compromiso', desc: 'Cancela cuando quieras, sin penalización' },
    { icon: <Headphones size={20} />, title: 'Soporte Premium', desc: 'Atención prioritaria 24/7' },
    { icon: <Globe size={20} />, title: 'Cobertura Total', desc: 'Envíos a todo Colombia' },
    { icon: <CheckCircle2 size={20} />, title: 'Súmate hoy', desc: 'A la revolución del ahorro' }
];

const garantiaItems = [
    { titulo: 'Satisfacción', desc: '7 días para probar', icono: '🎁' },
    { titulo: 'Seguridad', desc: 'Datos protegidos', icono: '🔒' },
    { titulo: 'Flexibilidad', desc: 'Sin cláusulas ocultas', icono: '📋' }
];

const statsDemo = {
    cashbackGanado: 45000,
    enviosGratis: 12,
    ofertasAccedidas: 8,
    proximoNivel: 75,
    ahorroEnvios: 300000,
    comprasMes: 4
};

const faqItems = [
    { 
        pregunta: '¿Puedo cancelar en cualquier momento?', 
        respuesta: 'Sí, puedes cancelar cuando quieras desde tu panel. No hay penalizaciones ni compromisos de permanencia. La suscripción bleibt activa hasta el final del período pagado.' 
    },
    { 
        pregunta: '¿Cómo se acredita el cashback?', 
        respuesta: 'El cashback del 2% (en lugar del 1% regular) se acredita automáticamente en tu Tribu Card después de cada compra exitosa. No necesitas hacer nada adicional.' 
    },
    { 
        pregunta: '¿El envío gratis tiene límite?', 
        respuesta: 'No, tienes envíos ilimitados sin costo adicional a cualquier lugar de Colombia. No hay mínimo de compra requerido.' 
    },
    { 
        pregunta: '¿Qué pasa con mis beneficios si cancelo?', 
        respuesta: 'Mantienes todos los beneficios hasta la fecha de tu próxima facturación. Después de eso, volverás al plan gratuito con cashback del 1% y costos de envío estándar.' 
    },
    { 
        pregunta: '¿Hay período de проба?', 
        respuesta: '¡Sí! Tienes 7 días para probar Tribu Pass. Si no quedas satisfecho, te devolvemos el primer mes. Sin preguntas, sin complicaciones.' 
    }
];

const testimonios = [
    { nombre: 'María C.', ciudad: 'Bogotá', texto: 'El cashback x2 me ha permitido ahorrar más de $200K al mes. ¡Totalmente vale la pena!', estrellas: 5 },
    { nombre: 'Carlos R.', ciudad: 'Medellín', texto: 'Los envíos gratis son lo mejor. Pedí 8 veces este mes y no pagué nada en envíos.', estrellas: 5 },
    { nombre: 'Ana L.', ciudad: 'Cali', texto: 'Las ofertas VIP son brutales. Siempre llego primero a las promociones.', estrellas: 5 },
    { nombre: 'Jorge T.', ciudades: ['Bogotá', 'Cali'], texto: 'Llevo 6 meses con Tribu Pass y no lo cambio. El ROI es incredible.', estrellas: 5 }
];

export default function TribuPassPage() {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const [estado, setEstado] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [faqOpen, setFaqOpen] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [resEstado, resHistorial] = await Promise.all([
                getTribuPassEstado(),
                getTribuPassHistorial().catch(() => ({ data: [] }))
            ]);
            setEstado(resEstado.data);
            setHistorial(resHistorial.data);
            updateUser({ tribuPassActiva: resEstado.data.activa });
        } catch (error) {
            toast.error('Error al cargar información del Tribu Pass');
        } finally {
            setLoading(false);
        }
    };

    const [metodoPagoPass, setMetodoPagoPass] = useState('SALDO_TRIBU');

    useEffect(() => {
        const efipayStatus = new URLSearchParams(window.location.search).get('efipay');
        if (efipayStatus === 'approved') {
            const sync = async () => {
                try {
                    await syncEfipayTribuPass('approved');
                    toast.success('Pago de Tribu Pass aprobado. ¡Disfruta tus beneficios!');
                } catch (error) {
                    console.error('Error al sincronizar pago de Tribu Pass:', error);
                    toast.success('Pago de Tribu Pass aprobado. ¡Disfruta tus beneficios!');
                } finally {
                    cargarDatos();
                }
            };
            sync();
        } else if (efipayStatus === 'rejected') {
            toast.error('El pago del Tribu Pass fue rechazado. Intenta con otro método.');
        } else if (efipayStatus === 'pending') {
            toast('El pago del Tribu Pass está pendiente. Te notificaremos cuando se confirme.', { icon: '⏳' });
        }
    }, []);

    const handleActivar = async () => {
        setActionLoading(true);
        try {
            const res = await activarTribuPass(metodoPagoPass);
            if (res.data.success) {
                if (res.data.efipayCheckoutUrl) {
                    window.location.href = res.data.efipayCheckoutUrl;
                    return;
                }
                toast.success('¡Tribu Pass activado! Disfruta tus beneficios.');
                cargarDatos();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'No se pudo activar el Tribu Pass');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelar = async () => {
        setActionLoading(true);
        try {
            const res = await cancelarTribuPass();
            if (res.data.success) {
                toast.success('Tribu Pass cancelado correctamente.');
                setShowCancelConfirm(false);
                cargarDatos();
            }
        } catch (error) {
            toast.error('Error al cancelar la suscripción');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleRenovacion = async () => {
        const newValue = !estado.renovacionAutomatica;
        try {
            await actualizarRenovacionAutomatica(newValue);
            setEstado({ ...estado, renovacionAutomatica: newValue });
            toast.success(newValue ? 'Renovación automática activada' : 'Renovación automática desactivada');
        } catch (error) {
            toast.error('No se pudo actualizar la renovación automática');
        }
    };

    if (loading) return <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}><div className="spinner" /></div>;

    const benefits = [
        { 
            icon: <Zap color="#fbbf24" />, 
            title: 'Cashback Doble', 
            desc: 'Gana x2 en todas tus compras directamente a tu Tribu Card.',
            highlight: '+100%'
        },
        { 
            icon: <Truck color="#fbbf24" />, 
            title: 'Envío Gratis', 
            desc: '¡Olvídate del costo de envío! En Tribu Pass es gratis siempre.',
            highlight: 'Ilimitado'
        },
        { 
            icon: <Star color="#fbbf24" />, 
            title: 'Flash Sales VIP', 
            desc: 'Acceso anticipado a ofertas relámpago 30 minutos antes.',
            highlight: '30 min antes'
        },
        { 
            icon: <Gem color="#fbbf24" />, 
            title: 'Límite Extra', 
            desc: '+$5.000 de límite diario en la ruleta de premios.',
            highlight: '+$5K'
        }
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingTop: '4rem', paddingBottom: '6rem' }}>
            
            {/* Background Glows */}
            <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.05) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

            <div className="container" style={{ maxWidth: 1100, position: 'relative', zIndex: 1 }}>
                
                {/* Hero Section */}
                <div style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative' }}>
                    {/* Floating sparkles */}
                    <motion.div 
                        animate={{ y: [0, -10, 0], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        style={{ position: 'absolute', top: '10%', left: '10%', color: '#fbbf24', opacity: 0.5 }}
                    >
                        <Sparkles size={20} />
                    </motion.div>
                    <motion.div 
                        animate={{ y: [0, 10, 0], opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        style={{ position: 'absolute', top: '20%', right: '15%', color: '#fbbf24', opacity: 0.4 }}
                    >
                        <Sparkles size={16} />
                    </motion.div>

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #f59e0b20, #fbbf2410)', padding: '0.7rem 1.4rem', borderRadius: '100px', border: '1px solid #f59e0b40', marginBottom: '1.2rem', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Crown size={18} color="#fbbf24" />
                        <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Membresía Premium</span>
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 900, color: '#fff', margin: '0 0 0.8rem 0', letterSpacing: '-1px' }}
                    >
                        Potencia tu <span style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Experiencia Tribu</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', maxWidth: '550px', margin: '0 auto', lineHeight: 1.6 }}
                    >
                        Desbloquea beneficios exclusivos, envíos sin límites y el doble de recompensas en cada compra.
                    </motion.p>
                </div>

                {/* Stats Dashboard - Solo cuando está activa */}
                {estado?.activa && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ marginBottom: '3rem' }}
                    >
                        <div style={{ 
                            background: 'linear-gradient(135deg, rgba(20,20,25,0.9), rgba(30,30,40,0.7))', 
                            border: '1px solid rgba(251, 191, 36, 0.2)', 
                            borderRadius: '24px', 
                            padding: '1.5rem',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: '1rem'
                        }}>
                            <div style={{ textAlign: 'center', padding: '1rem', position: 'relative' }}>
                                <div style={{ background: 'rgba(251, 191, 36, 0.1)', width: 48, height: 48, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem' }}>
                                    <TrendingUp color="#fbbf24" size={22} />
                                </div>
                                <p style={{ color: '#888', fontSize: '0.7rem', fontWeight: 700, margin: '0 0 0.2rem 0', textTransform: 'uppercase' }}>Cashback Ganado</p>
                                <p style={{ color: '#fbbf24', fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>{formatCurrency(statsDemo.cashbackGanado)}</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ background: 'rgba(0, 200, 150, 0.1)', width: 48, height: 48, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem' }}>
                                    <Package color="#00c896" size={22} />
                                </div>
                                <p style={{ color: '#888', fontSize: '0.7rem', fontWeight: 700, margin: '0 0 0.2rem 0', textTransform: 'uppercase' }}>Envíos Gratis</p>
                                <p style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>{statsDemo.enviosGratis}</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ background: 'rgba(30, 144, 255, 0.1)', width: 48, height: 48, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem' }}>
                                    <Sparkles color="#1e90ff" size={22} />
                                </div>
                                <p style={{ color: '#888', fontSize: '0.7rem', fontWeight: 700, margin: '0 0 0.2rem 0', textTransform: 'uppercase' }}>Ofertas VIP</p>
                                <p style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>{statsDemo.ofertasAccedidas}</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ background: 'rgba(168, 85, 247, 0.1)', width: 48, height: 48, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem' }}>
                                    <Wallet color="#a855f7" size={22} />
                                </div>
                                <p style={{ color: '#888', fontSize: '0.7rem', fontWeight: 700, margin: '0 0 0.2rem 0', textTransform: 'uppercase' }}>Ahorro Total</p>
                                <p style={{ color: '#a855f7', fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>{formatCurrency(statsDemo.cashbackGanado + statsDemo.ahorroEnvios)}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Trust Badges - Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    style={{ marginBottom: '2.5rem' }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                        <p style={{ color: '#666', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>¿Por qué confiar en Tribu Pass?</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.8rem' }}>
                        {trustItems.map((item, i) => (
                            <motion.div 
                                key={i}
                                whileHover={{ scale: 1.02, y: -2 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', background: 'rgba(20,20,25,0.5)', padding: '0.9rem 1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.03)', cursor: 'default' }}
                            >
                                <div style={{ background: 'rgba(251, 191, 36, 0.08)', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <div style={{ color: '#fbbf24' }}>{item.icon}</div>
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem', margin: 0, whiteSpace: 'nowrap' }}>{item.title}</p>
                                    <p style={{ color: '#555', fontSize: '0.7rem', margin: 0 }}>{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Garantías */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    style={{ marginBottom: '2.5rem' }}
                >
                    <div style={{ 
                        background: 'linear-gradient(135deg, rgba(0, 200, 150, 0.05), rgba(0, 200, 150, 0.02))', 
                        border: '1px solid rgba(0, 200, 150, 0.12)', 
                        borderRadius: '20px', 
                        padding: '1.2rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        {garantiaItems.map((g, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>{g.icono}</span>
                                <div>
                                    <p style={{ color: '#00c896', fontWeight: 700, fontSize: '0.8rem', margin: 0 }}>{g.titulo}</p>
                                    <p style={{ color: '#666', fontSize: '0.7rem', margin: 0 }}>{g.desc}</p>
                                </div>
                            </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                            <BadgeCheck color="#00c896" size={22} />
                            <div>
                                <p style={{ color: '#00c896', fontWeight: 700, fontSize: '0.8rem', margin: 0 }}>100% Transparente</p>
                                <p style={{ color: '#666', fontSize: '0.7rem', margin: 0 }}>Sin letras pequeñas</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', gap: '2rem' }}>
                    
                    {/* Benefits Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ background: 'rgba(20,20,25,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '28px', padding: '2rem', backdropFilter: 'blur(20px)' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.8rem', margin: 0 }}>
                                <ShieldCheck color="#fbbf24" size={26} /> Tu Pack de Beneficios
                            </h2>
                            <div style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, color: '#000' }}>
                                {estado?.activa ? 'ACTIVO' : 'DISPONIBLE'}
                            </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
                            {benefits.map((b, i) => (
                                <motion.div 
                                    key={i} 
                                    whileHover={{ scale: 1.02, borderColor: 'rgba(251, 191, 36, 0.3)' }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(251, 191, 36, 0.08)', position: 'relative', overflow: 'hidden' }}
                                >
                                    <div style={{ position: 'absolute', top: 0, right: 0, background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.15))', padding: '0.2rem 0.5rem', borderRadius: '0 14px 0 10px', fontSize: '0.6rem', fontWeight: 800, color: '#fbbf24' }}>
                                        {b.highlight}
                                    </div>
                                    <div style={{ width: '36px', height: '36px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {b.icon}
                                    </div>
                                    <div>
                                        <h4 style={{ color: '#fff', fontWeight: 700, margin: '0 0 0.2rem 0', fontSize: '0.9rem' }}>{b.title}</h4>
                                        <p style={{ color: '#777', fontSize: '0.75rem', margin: 0, lineHeight: 1.4 }}>{b.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* ROI Section */}
                        <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02))', borderRadius: '14px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                <Calculator color="#fbbf24" size={18} />
                                <p style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>¿Vale la pena?</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.8rem' }}>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '10px', textAlign: 'center' }}>
                                    <p style={{ color: '#666', fontSize: '0.7rem', margin: '0 0 0.3rem 0', fontWeight: 600 }}>Costo Mensual</p>
                                    <p style={{ color: '#ff6b6b', fontSize: '1rem', fontWeight: 800, margin: 0 }}>{formatCurrency(9900)}</p>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '10px', textAlign: 'center' }}>
                                    <p style={{ color: '#666', fontSize: '0.7rem', margin: '0 0 0.3rem 0', fontWeight: 600 }}>Envío promedio</p>
                                    <p style={{ color: '#aaa', fontSize: '1rem', fontWeight: 800, margin: 0 }}>{formatCurrency(25000)}</p>
                                </div>
                            </div>
                            <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
                                <strong style={{ color: '#00c896' }}>¡Con 1 solo envío gratis</strong> al mes ya recuperas con creces tu inversión!
                            </p>
                        </div>
                    </motion.div>

                    {/* Subscription Management */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                    >
                        {/* Status Card */}
                        <div style={{ 
                            background: estado?.activa ? 'linear-gradient(135deg, #12121a, #1a1a28)' : 'rgba(20,20,25,0.4)', 
                            border: estado?.activa ? '1px solid #fbbf2430' : '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '28px', padding: '2rem', position: 'relative', overflow: 'hidden' 
                        }}>
                            {estado?.activa && (
                                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, #fbbf2420 0%, transparent 70%)', filter: 'blur(20px)' }} />
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                <div>
                                    <span style={{ color: '#666', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Estado de Suscripción
                                    </span>
                                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: '0.5rem 0' }}>
                                        {estado?.activa ? <span style={{ color: '#fbbf24' }}>Activa <Sparkles size={24} style={{ verticalAlign: 'middle', marginLeft: 4 }} /></span> : 'Inactiva'}
                                    </h3>
                                </div>
                                <div style={{ background: estado?.activa ? '#fbbf2415' : '#333', padding: '0.6rem 1.2rem', borderRadius: '12px', color: estado?.activa ? '#fbbf24' : '#aaa', fontWeight: 700, fontSize: '0.85rem' }}>
                                    {formatCurrency(9900)} <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>/mes</span>
                                </div>
                            </div>

                            {estado?.activa ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '14px' }}>
                                        <Calendar size={18} color="#888" />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ color: '#666', fontSize: '0.7rem', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>Próxima Renovación</p>
                                            <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                                                {new Date(estado.fechaRenovacion).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <RefreshCcw size={18} color="#888" />
                                            <div>
                                                <p style={{ color: '#666', fontSize: '0.7rem', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>Renovación Auto</p>
                                                <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>{estado.renovacionAutomatica ? 'Activada' : 'Desactivada'}</p>
                                            </div>
                                        </div>
                                        <div 
                                            onClick={handleToggleRenovacion}
                                            style={{ 
                                                width: '48px', height: '26px', background: estado.renovacionAutomatica ? 'var(--color-primary)' : '#444', 
                                                borderRadius: '20px', cursor: 'pointer', position: 'relative', transition: 'all 0.3s' 
                                            }}
                                        >
                                            <div style={{ 
                                                position: 'absolute', top: '3px', left: estado.renovacionAutomatica ? '25px' : '3px', 
                                                width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'all 0.3s' 
                                            }} />
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setShowCancelConfirm(true)}
                                        style={{ background: 'transparent', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d', padding: '0.9rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem', transition: 'all 0.3s' }}
                                        onMouseEnter={(e) => { e.target.style.background = 'rgba(255,77,77,0.05)'; e.target.style.borderColor = '#ff4d4d'; }}
                                        onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'rgba(255,77,77,0.3)'; }}
                                    >
                                        Cancelar suscripción
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#888', fontSize: '0.9rem' }}>
                                        <CheckCircle2 size={18} color="#00C896" /> Sin contratos, cancela cuando quieras
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#888', fontSize: '0.9rem' }}>
                                        <CheckCircle2 size={18} color="#00C896" /> Renovación automática opcional
                                    </div>

                                    <div style={{ marginBottom: '0.8rem' }}>
                                        <label style={{ color: '#888', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Método de pago</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => setMetodoPagoPass('SALDO_TRIBU')}
                                                style={{
                                                    flex: 1, padding: '0.7rem', borderRadius: '10px',
                                                    border: metodoPagoPass === 'SALDO_TRIBU' ? '2px solid #fbbf24' : '1px solid #333',
                                                    background: metodoPagoPass === 'SALDO_TRIBU' ? 'rgba(251,191,36,0.1)' : 'transparent',
                                                    color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer'
                                                }}
                                            >
                                                Tribu Card
                                            </button>
                                            <button
                                                onClick={() => setMetodoPagoPass('EFIPAY')}
                                                style={{
                                                    flex: 1, padding: '0.7rem', borderRadius: '10px',
                                                    border: metodoPagoPass === 'EFIPAY' ? '2px solid #6243FF' : '1px solid #333',
                                                    background: metodoPagoPass === 'EFIPAY' ? 'rgba(98, 67, 255, 0.12)' : 'transparent',
                                                    color: metodoPagoPass === 'EFIPAY' ? '#B7A9FF' : '#fff',
                                                    fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                                                }}
                                            >
                                                Efipay
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <motion.button
                                        whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)' }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={handleActivar}
                                        disabled={actionLoading}
                                        style={{ 
                                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', 
                                            border: 'none', padding: '1.1rem', borderRadius: '16px', 
                                            color: '#000', fontWeight: 800, fontSize: '1rem', 
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', 
                                            justifyContent: 'center', gap: '0.8rem', marginTop: '0.5rem' 
                                        }}
                                    >
                                        {actionLoading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 3, borderTopColor: '#000' }} /> : <>Activar Tribu Pass <ArrowRight size={20} /></>}
                                    </motion.button>
                                </div>
                            )}
                        </div>

                        {/* Tip Card */}
                        <div style={{ background: 'rgba(30, 144, 255, 0.05)', border: '1px solid rgba(30, 144, 255, 0.15)', borderRadius: '20px', padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ background: '#1e90ff15', padding: '0.6rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertCircle size={20} color="#1e90ff" />
                            </div>
                            <div>
                                <p style={{ color: '#1e90ff', fontSize: '0.8rem', fontWeight: 700, margin: '0 0 0.3rem 0' }}>Tip Premium</p>
                                <p style={{ color: '#aaa', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                                    Con el doble de cashback, en solo 2-3 compras ya habrás recuperado el costo mensual. ¡Cada compra cuenta el doble!
                                </p>
                            </div>
                        </div>
                    </motion.div>

                </div>

                {/* History Section */}
                {historial.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ marginTop: '4rem' }}
                    >
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <History size={24} color="var(--color-primary)" /> Historial de Renovaciones
                        </h3>
                        
                        <div style={{ background: 'rgba(20,20,25,0.4)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                        <th style={{ padding: '1.2rem', color: '#888', fontSize: '0.8rem', fontWeight: 800 }}>FECHA</th>
                                        <th style={{ padding: '1.2rem', color: '#888', fontSize: '0.8rem', fontWeight: 800 }}>MONTO</th>
                                        <th style={{ padding: '1.2rem', color: '#888', fontSize: '0.8rem', fontWeight: 800 }}>ESTADO</th>
                                        <th style={{ padding: '1.2rem', color: '#888', fontSize: '0.8rem', fontWeight: 800 }}>REF. MOVIMIENTO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historial.map((h, i) => (
                                        <tr key={h.id} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '1.2rem', color: '#fff', fontSize: '0.9rem' }}>
                                                {new Date(h.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '1.2rem', color: '#fff', fontWeight: 700 }}>{formatCurrency(h.monto)}</td>
                                            <td style={{ padding: '1.2rem' }}>
                                                <span style={{ 
                                                    background: h.estado === 'EXITOSA' ? 'rgba(0, 200, 150, 0.1)' : 'rgba(255, 77, 77, 0.1)', 
                                                    color: h.estado === 'EXITOSA' ? '#00c896' : '#ff4d4d',
                                                    padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700
                                                }}>
                                                    {h.estado}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.2rem', color: '#666', fontSize: '0.9rem', fontFamily: 'monospace' }}>#{h.movimientoId || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Testimonios Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{ marginTop: '4rem' }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <p style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 0.5rem 0' }}>Lo que dicen nuestros miembros</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Quote size={24} color="var(--color-primary)" /> Reseñas Reales
                        </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                        {testimonios.map((t, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.02 }}
                                style={{ background: 'rgba(20,20,25,0.5)', borderRadius: '16px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}
                            >
                                <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.8rem' }}>
                                    {[...Array(t.estrellas)].map((_, i) => (
                                        <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
                                    ))}
                                </div>
                                <p style={{ color: '#ccc', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem 0', fontStyle: 'italic' }}>"{t.texto}"</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#000' }}>
                                        {t.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>{t.nombre}</p>
                                        <p style={{ color: '#666', fontSize: '0.7rem', margin: 0 }}>{t.ciudad || t.ciudades?.join(', ')}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{ marginTop: '4rem', marginBottom: '2rem' }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <p style={{ color: '#666', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 0.5rem 0' }}>¿Tienes dudas?</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <HelpCircle size={24} color="var(--color-primary)" /> Preguntas Frecuentes
                        </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxWidth: '800px', margin: '0 auto' }}>
                        {faqItems.map((faq, i) => (
                            <motion.div
                                key={i}
                                layout
                                style={{ background: 'rgba(20,20,25,0.5)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden' }}
                            >
                                <button
                                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                                    style={{ width: '100%', padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                >
                                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{faq.pregunta}</span>
                                    <div style={{ color: '#fbbf24', display: 'flex', alignItems: 'center' }}>
                                        {faqOpen === i ? <Minus size={18} /> : <Plus size={18} />}
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {faqOpen === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div style={{ padding: '0 1.2rem 1rem 1.2rem' }}>
                                                <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{faq.respuesta}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA Final */}
                {!estado?.activa && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        style={{ marginTop: '3rem', textAlign: 'center' }}
                    >
                        <div style={{ 
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.02))', 
                            border: '1px solid rgba(245, 158, 11, 0.2)', 
                            borderRadius: '24px', 
                            padding: '2.5rem',
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}>
                            <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
                                <Rocket size={28} color="#000" />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0 0 0.8rem 0' }}>¿Listo para desbloquear tu potencial?</h3>
                            <p style={{ color: '#aaa', fontSize: '0.95rem', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
                                Súmate hoy a la comunidad de compradores inteligentes que ya están ahorrando más y ganando más con Tribu Pass.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: '0 15px 40px rgba(245, 158, 11, 0.5)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleActivar}
                                disabled={actionLoading}
                                style={{ 
                                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', 
                                    border: 'none', padding: '1rem 2.5rem', borderRadius: '16px', 
                                    color: '#000', fontWeight: 800, fontSize: '1.05rem', 
                                    cursor: 'pointer' 
                                }}
                            >
                                {actionLoading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 3, borderTopColor: '#000' }} /> : '¡Activar Ahora!'}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

            </div>

            {/* Cancel Confirmation Modal */}
            <AnimatePresence>
                {showCancelConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={{ background: '#12121a', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '32px', padding: '2.5rem', maxWidth: '450px', width: '100%', textAlign: 'center' }}
                        >
                            <div style={{ width: '80px', height: '80px', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <XCircle size={40} color="#ff4d4d" />
                            </div>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>¿Estás seguro?</h3>
                            <p style={{ color: '#aaa', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                                Perderás tu beneficio de <strong>cashback x2</strong> y los <strong>envíos gratis</strong> inmediatamente al finalizar el periodo actual.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button 
                                    onClick={() => setShowCancelConfirm(false)}
                                    style={{ flex: 1, padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    ¡No, mantener!
                                </button>
                                <button 
                                    onClick={handleCancelar}
                                    disabled={actionLoading}
                                    style={{ flex: 1, padding: '1rem', borderRadius: '14px', background: '#ff4d4d', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    {actionLoading ? 'Cancelando...' : 'Sí, cancelar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
