import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    WalletCards, 
    CreditCard, 
    Sparkles, 
    Gift, 
    ShieldCheck, 
    Zap, 
    ShoppingBag, 
    History, 
    Star, 
    BarChart3, 
    Users, 
    Copy, 
    TrendingUp,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCcw,
    Coins
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMiPerfil, getMisMovimientos, crearTarjeta } from '../api'
import RuletaModal from '../components/RuletaModal'
import { Link, useNavigate } from 'react-router-dom'
import { useNotification } from '../context/NotificationContext'
import { toast } from 'react-hot-toast'

import TribuCard from '../components/TribuCard'
import TribuCardMinting from '../components/TribuCardMinting'
import ConfettiCanvas from '../components/ConfettiCanvas'
import TierUpToast from '../components/TierUpToast'
import { useWebSocketAnimation } from '../hooks/useWebSocketAnimation'

const BilleteraPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { saldoRealtime, notificaciones: notiContext, conectado } = useNotification();
    const [perfil, setPerfil] = useState(null);
    const [movimientos, setMovimientos] = useState([]);
    const [tarjetaCreada, setTarjetaCreada] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showRuleta, setShowRuleta] = useState(false);
    
    const cardRef = useRef(null);
    const [saldoLocal, setSaldoLocal] = useState(null);
    const [animarSaldo, setAnimarSaldo] = useState(false);

    const { tierPromocion, mostrarConfeti, CoinParticlesComponent } = useWebSocketAnimation({
        cardRef,
        onSaldoUpdate: (nuevoSaldo) => {
            setSaldoLocal(nuevoSaldo);
            setAnimarSaldo(true);
            setTimeout(() => setAnimarSaldo(false), 1000);
        }
    });

    const tierActual = perfil ? {
        nombre: perfil.nivelVip === 3 ? 'ORO' : perfil.nivelVip === 2 ? 'PLATA' : 'BRONCE',
        orden: perfil.nivelVip || 1,
        beneficios: []
    } : null;

    useEffect(() => {
        if (!user) return;
        getMiPerfil().then(res => {
            setPerfil(res.data);
            setSaldoLocal(res.data.saldoFavor || 0);
            if (res.data.tarjetaCreada) {
                setTarjetaCreada(true);
            }
        }).catch(() => { });
        getMisMovimientos().then(res => setMovimientos(res.data)).catch(() => { });
    }, [user]);

    useEffect(() => {
        if (saldoRealtime !== null) {
            setSaldoLocal(saldoRealtime);
        }
    }, [saldoRealtime]);

    useEffect(() => {
        if (notiContext.length > 0) {
            getMisMovimientos().then(res => setMovimientos(res.data)).catch(() => { });
        }
    }, [notiContext]);

    const canSpinToday = () => {
        if (!perfil || !perfil.fechaUltimoGiroRuleta) return true
        const lastSpin = new Date(perfil.fechaUltimoGiroRuleta)
        const today = new Date()
        return lastSpin.getDate() !== today.getDate() ||
            lastSpin.getMonth() !== today.getMonth() ||
            lastSpin.getFullYear() !== today.getFullYear()
    }

    const handleCrearTarjeta = () => {
        setIsCreating(true)
        setTimeout(async () => {
            try {
                await crearTarjeta()
                setTarjetaCreada(true)
            } catch {
                toast.error('Error al crear la tarjeta, intenta de nuevo')
            }
            setIsCreating(false)
        }, 3000)
    }

    const formatCurrency = (monto) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(monto || 0) + ' pts'

    const getCardNumber = () => {
        if (!user) return '•••• •••• •••• ••••'
        const seed = user.email.charCodeAt(0).toString().padStart(4, '0')
        return `5489 1234 9876 ${seed}`
    }

    // Dynamic stats computation
    const getStats = () => {
        let ganadosHoy = 0;
        let usadosEsteMes = 0;
        let premiosCanjeados = 0;

        const hoy = new Date();
        const hoyStr = hoy.toDateString();
        const esteMes = hoy.getMonth();
        const esteAno = hoy.getFullYear();

        if (Array.isArray(movimientos)) {
            movimientos.forEach(mov => {
                const fechaMov = new Date(mov.fecha);
                const monto = mov.monto || 0;

                // 1. Ganados hoy
                if (fechaMov.toDateString() === hoyStr && monto > 0) {
                    ganadosHoy += monto;
                }

                // 2. Usados este mes (negative values accumulated)
                if (fechaMov.getMonth() === esteMes && fechaMov.getFullYear() === esteAno && monto < 0) {
                    usadosEsteMes += Math.abs(monto);
                }

                // 3. Premios canjeados
                if (mov.tipo === 'PREMIO_RULETA' || mov.tipo === 'ROULETTE_REWARD') {
                    premiosCanjeados += 1;
                }
            });
        }

        return { ganadosHoy, usadosEsteMes, premiosCanjeados };
    };

    const stats = getStats();

    if (!perfil) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Cargando...</div>

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingTop: '4rem', paddingBottom: '4rem' }}>
            <div className="container" style={{ maxWidth: 680 }}>

                {/* Page Title & Badge Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', width: '100%' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <WalletCards size={22} color="var(--color-primary)" /> Billetera de puntos
                        </h1>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 1.5rem 0' }}>
                            Tus puntos, reembolsos y premios en un solo lugar.
                        </p>
                    </div>
                    
                    <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        fontSize: '12px', 
                        color: conectado ? '#1D9E75' : '#888', 
                        background: conectado ? '#E1F5EE' : 'rgba(255, 255, 255, 0.05)', 
                        padding: '3px 10px', 
                        borderRadius: '20px', 
                        fontWeight: 600 
                    }}>
                        <span style={{ 
                            width: '6px', 
                            height: '6px', 
                            borderRadius: '50%', 
                            background: conectado ? '#1D9E75' : '#888',
                            boxShadow: conectado ? '0 0 8px #1D9E75' : 'none'
                        }} />
                        {conectado ? 'En vivo' : 'Offline'}
                    </span>
                </div>

                <TribuCardMinting saldo={saldoLocal ?? 0} tierActual={tierActual} />

                <AnimatePresence mode="wait">
                    {!tarjetaCreada ? (
                        <motion.div
                            key="onboarding"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -50, scale: 0.9 }}
                            transition={{ duration: 0.5 }}
                            className="mobile-p-md"
                            style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '24px', padding: '3rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
                        >
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,87,34,0.15) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

                            <motion.div
                                animate={isCreating ? { rotateY: 360, scale: [1, 1.1, 1], filter: ['blur(0px)', 'blur(10px)', 'blur(0px)'] } : { y: [0, -10, 0] }}
                                transition={isCreating ? { duration: 2, ease: "easeInOut" } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                style={{
                                    width: '100%', maxWidth: '420px', margin: '0 auto 2rem',
                                    borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden'
                                }}
                            >
                                {isCreating ? (
                                    <div style={{ width: '100%', height: '240px', background: 'var(--color-card-bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px', border: '1px solid var(--color-card-border)' }}>
                                        <Sparkles size={48} color="#FF5722" className="rotating" />
                                    </div>
                                ) : (
                                    <TribuCard
                                        saldo={0}
                                        animatorSaldo={false}
                                        tierActual={{ orden: 1 }}
                                        cardNumber="•••• •••• •••• ••••"
                                    />
                                )}
                            </motion.div>

                            <h2 style={{ fontSize: '1.8rem', color: 'var(--color-text)', marginBottom: '1rem' }}>
                                {isCreating ? 'Emitiendo tu tarjeta virtual...' : 'Adquiere tu Tarjeta Virtual Tribu'}
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
                                {isCreating
                                    ? 'Estamos configurando tus accesos de seguridad, encriptando los fondos y asignando un número único. Por favor espera.'
                                    : 'Activa tu tarjeta  ahora mismo para poder recibir reembolsos al instante por tus devoluciones, girar la ruleta por premios diarios y tener control total de tu dinero.'}
                            </p>

                            {!isCreating && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}><ShieldCheck size={18} color="#00C896" /> Emisión Gratuita</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}><Zap size={18} color="#ffb84d" /> Uso Instantáneo</div>
                                </div>
                            )}

                            <motion.button
                                whileHover={{ scale: isCreating ? 1 : 1.05 }}
                                whileTap={{ scale: isCreating ? 1 : 0.95 }}
                                onClick={handleCrearTarjeta}
                                disabled={isCreating}
                                style={{
                                    background: isCreating ? '#444' : 'linear-gradient(45deg, #FF5722, #FF9800)',
                                    border: 'none', padding: '1rem 2.5rem', borderRadius: '12px', color: '#fff', fontSize: '1.1rem', fontWeight: 700, cursor: isCreating ? 'default' : 'pointer',
                                    boxShadow: isCreating ? 'none' : '0 10px 25px rgba(255,87,34,0.4)', transition: 'background 0.3s'
                                }}
                            >
                                {isCreating ? 'Procesando...' : 'Obtener mi Tarjeta Ahora'}
                            </motion.button>
                        </motion.div>

                    ) : (

                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, type: "spring" }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}
                        >
                            {/* TribuCard Centered */}
                            <div ref={cardRef} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                <TribuCard
                                    saldo={saldoLocal ?? perfil?.saldoFavor ?? 0}
                                    animatorSaldo={animarSaldo}
                                    tierActual={tierActual}
                                    cardNumber={getCardNumber()}
                                />
                            </div>

                            {/* Stats Row */}
                            <div className="responsive-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', width: '100%' }}>
                                <div style={{ background: 'var(--color-card-bg-soft)', borderRadius: '14px', padding: '0.75rem 1rem', border: '1px solid var(--color-card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
                                        +{new Intl.NumberFormat('es-CO').format(stats.ganadosHoy)}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Ganados hoy</div>
                                    <div style={{ fontSize: '11px', color: '#1D9E75', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
                                        <TrendingUp size={12} /> +8%
                                    </div>
                                </div>
                                <div style={{ background: 'var(--color-card-bg-soft)', borderRadius: '14px', padding: '0.75rem 1rem', border: '1px solid var(--color-card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
                                        {new Intl.NumberFormat('es-CO').format(stats.usadosEsteMes)}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Usados este mes</div>
                                </div>
                                <div style={{ background: 'var(--color-card-bg-soft)', borderRadius: '14px', padding: '0.75rem 1rem', border: '1px solid var(--color-card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
                                        {stats.premiosCanjeados}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Premios canjeados</div>
                                </div>
                            </div>

                            {/* Actions Row */}
                            <div className="responsive-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', width: '100%' }}>
                                {canSpinToday() ? (
                                    <motion.button
                                        whileHover={{ scale: 1.02, translateY: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowRuleta(true)}
                                        style={{ background: '#E8621A', color: '#fff', border: 'none', borderRadius: '14px', padding: '13px 0', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', boxShadow: '0 8px 20px rgba(232, 98, 26, 0.3)' }}
                                    >
                                        <Gift size={16} /> Ruleta diaria
                                    </motion.button>
                                ) : (
                                    <button
                                        disabled
                                        style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.3)', border: 'none', borderRadius: '14px', padding: '13px 0', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', cursor: 'not-allowed' }}
                                    >
                                        <Gift size={16} /> Ruleta jugada
                                    </button>
                                )}

                                <Link to="/transferir" style={{ textDecoration: 'none', width: '100%' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.02, translateY: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{ background: 'transparent', color: '#00C896', border: '1.5px solid #00C896', borderRadius: '14px', padding: '11.5px 0', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}
                                    >
                                        <Zap size={16} /> Transferir
                                    </motion.button>
                                </Link>

                                <Link to="/cobro-qr" style={{ textDecoration: 'none', width: '100%' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.02, translateY: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{ background: 'transparent', color: '#ffb84d', border: '1.5px solid #ffb84d', borderRadius: '14px', padding: '11.5px 0', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}
                                    >
                                        <Coins size={16} /> Cobro QR
                                    </motion.button>
                                </Link>
                            </div>

                            {/* Quick Actions Header */}
                            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '-0.5rem', marginTop: '0.5rem' }}>
                                Acciones rápidas
                            </div>

                            {/* Quick Actions Grid */}
                            <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', width: '100%' }}>
                                <motion.div 
                                    whileHover={{ scale: 1.04, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => navigate('/recompensas')}
                                    style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '14px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                >
                                    <ShoppingBag size={20} color="var(--color-text-muted)" />
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.3 }}>Canjear puntos</span>
                                </motion.div>

                                <motion.div 
                                    whileHover={{ scale: 1.04, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => {
                                        const el = document.getElementById('historial-movimientos');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '14px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                >
                                    <History size={20} color="var(--color-text-muted)" />
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.3 }}>Historial</span>
                                </motion.div>

                                <motion.div 
                                    whileHover={{ scale: 1.04, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => navigate('/recompensas')}
                                    style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '14px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                >
                                    <Star size={20} color="var(--color-text-muted)" />
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.3 }}>Mis premios</span>
                                </motion.div>

                                <motion.div 
                                    whileHover={{ scale: 1.04, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => navigate('/leaderboard')}
                                    style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '14px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                >
                                    <BarChart3 size={20} color="var(--color-text-muted)" />
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.3 }}>Estadísticas</span>
                                </motion.div>
                            </div>

                            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '0.5rem 0' }} />

                            {/* Referral Section */}
                            {perfil.codigoReferido && (
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(232, 98, 26, 0.1)', flexShrink: 0 }}>
                                        <Users size={24} color="#E8621A" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>Trae a tu tribu y gana puntos</div>
                                        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Comparte tu código — tú y tu amigo ganan.</div>
                                    </div>
                                    <motion.div 
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(perfil.codigoReferido);
                                                toast.success('¡Código copiado!');
                                            } catch (e) {
                                                const textArea = document.createElement('textarea');
                                                textArea.value = perfil.codigoReferido;
                                                document.body.appendChild(textArea);
                                                textArea.select();
                                                document.execCommand('copy');
                                                document.body.removeChild(textArea);
                                                toast.success('¡Código copiado!');
                                            }
                                        }}
                                        style={{ background: 'var(--color-background)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0 }}
                                    >
                                        <Copy size={14} /> {perfil.codigoReferido}
                                    </motion.div>
                                </div>
                            )}

                            {/* Terms & Conditions Section */}
                            <div className="mobile-p-md" style={{
                                background: 'rgba(255, 255, 255, 0.01)',
                                border: '1px solid rgba(255, 255, 255, 0.03)',
                                borderRadius: '1.5rem',
                                padding: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    🛡️ Términos y Condiciones de los Puntos Tribu
                                </h3>
                                <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                                    Los <strong>Puntos Tribu (pts)</strong> son unidades de fidelidad de uso exclusivamente interno dentro de la plataforma Tribu.
                                </p>
                                <ul style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.6, margin: 0, paddingLeft: '1.2rem' }}>
                                    <li style={{ marginBottom: '0.5rem' }}>
                                        <strong>Sin valor comercial externo:</strong> Los puntos no constituyen moneda de curso legal, no tienen equivalencia monetaria reembolsable en dinero real fuera de Tribu, ni pueden ser transferidos a cuentas bancarias externas.
                                    </li>
                                    <li style={{ marginBottom: '0.5rem' }}>
                                        <strong>Redención interna:</strong> Solo son válidos para adquirir productos, pagar cuentas compartidas en Compras Grupales o canjear beneficios dentro del ecosistema Tribu.
                                    </li>
                                    <li>
                                        <strong>Legales y Seguros:</strong> Al operar como un programa de recompensas y acumulación de puntos, está plenamente alineado con el marco legal aplicable a programas de lealtad y fidelización de clientes.
                                    </li>
                                </ul>
                            </div>

                            {/* Movements List Section */}
                            <div id="historial-movimientos" className="mobile-p-md" style={{ background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1.5rem', padding: '2rem' }}>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Últimos Movimientos
                                </h3>

                                {Array.isArray(movimientos) && movimientos.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {movimientos.map(mov => {
                                            // Helper para estilos estéticos por tipo
                                            const getMovStyle = (tipo, monto) => {
                                                switch (tipo) {
                                                    case 'ROULETTE_REWARD':
                                                    case 'PREMIO_RULETA':
                                                        return { icon: <Gift size={20} color="#E8621A" />, bg: 'rgba(232, 98, 26, 0.12)', border: 'rgba(232, 98, 26, 0.25)', color: '#E8621A' };
                                                    case 'WELCOME_BONUS':
                                                    case 'REGALO_BIENVENIDA':
                                                        return { icon: <Sparkles size={20} color="#BA68C8" />, bg: 'rgba(156, 39, 176, 0.12)', border: 'rgba(156, 39, 176, 0.25)', color: '#BA68C8' };
                                                    case 'REFERRAL_BONUS':
                                                    case 'REFERIDO_EXITOSO':
                                                        return { icon: <Users size={20} color="#2196F3" />, bg: 'rgba(33, 150, 243, 0.12)', border: 'rgba(33, 150, 243, 0.25)', color: '#2196F3' };
                                                    case 'CASHBACK':
                                                    case 'CASHBACK_COMPRA':
                                                        return { icon: <Coins size={20} color="#00C896" />, bg: 'rgba(0, 200, 150, 0.12)', border: 'rgba(0, 200, 150, 0.25)', color: '#00C896' };
                                                    case 'REEMBOLSO':
                                                        return { icon: <RefreshCcw size={20} color="#4CAF50" />, bg: 'rgba(76, 175, 80, 0.12)', border: 'rgba(76, 175, 80, 0.25)', color: '#4CAF50' };
                                                    case 'TRANSFERENCIA_ENVIADA':
                                                        return { icon: <ArrowUpRight size={20} color="#E53935" />, bg: 'rgba(244, 67, 54, 0.12)', border: 'rgba(244, 67, 54, 0.25)', color: '#E53935' };
                                                    case 'TRANSFERENCIA_RECIBIDA':
                                                        return { icon: <ArrowDownLeft size={20} color="#00C896" />, bg: 'rgba(0, 200, 150, 0.12)', border: 'rgba(0, 200, 150, 0.25)', color: '#00C896' };
                                                    case 'PURCHASE':
                                                    case 'TRIBU_PASS_PAGO':
                                                        return { icon: <ShoppingBag size={20} color="#fff" />, bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)', color: '#fff' };
                                                    case 'RECOMPENSA_CANJE':
                                                        return { icon: <Star size={20} color="#FDD835" />, bg: 'rgba(255, 235, 59, 0.1)', border: 'rgba(255, 235, 59, 0.2)', color: '#FDD835' };
                                                    default:
                                                        return monto < 0 
                                                            ? { icon: <CreditCard size={20} color="#aaa" />, bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.05)', color: '#aaa' }
                                                            : { icon: <Zap size={20} color="#00C896" />, bg: 'rgba(0, 200, 150, 0.12)', border: 'rgba(0, 200, 150, 0.25)', color: '#00C896' };
                                                }
                                            };

                                            const formatTipo = (tipo) => {
                                                return tipo
                                                    .replace('ROULETTE_REWARD', 'Premio Ruleta')
                                                    .replace('PREMIO_RULETA', 'Premio Ruleta')
                                                    .replace('REFERRAL_BONUS', 'Bono Referido')
                                                    .replace('REFERIDO_EXITOSO', 'Bono Referido')
                                                    .replace('WELCOME_BONUS', 'Regalo Bienvenida')
                                                    .replace('REGALO_BIENVENIDA', 'Regalo Bienvenida')
                                                    .replace('CASHBACK_COMPRA', 'Cashback')
                                                    .replace('CASHBACK', 'Cashback')
                                                    .replace('REEMBOLSO', 'Reembolso')
                                                    .replace('AJUSTE_ADMIN', 'Ajuste Admin')
                                                    .replace('TRANSFERENCIA_ENVIADA', 'Transferencia Enviada')
                                                    .replace('TRANSFERENCIA_RECIBIDA', 'Transferencia Recibida')
                                                    .replace('PAGO_QR', 'Pago QR')
                                                    .replace('RECOMPENSA_CANJE', 'Canje de Premio')
                                                    .replace('TRIBU_PASS_PAGO', 'Pago Tribu Pass')
                                                    .replace('PURCHASE', 'Compra Realizada')
                                                    .replace('_', ' ');
                                            };

                                            const styleInfo = getMovStyle(mov.tipo, mov.monto);

                                            return (
                                                <motion.div 
                                                    key={mov.id} 
                                                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.04)' }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                                    style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        alignItems: 'center', 
                                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', 
                                                        padding: '1.2rem 1.5rem', 
                                                        borderRadius: '16px', 
                                                        border: `1px solid ${styleInfo.border}`,
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', minWidth: 0, flex: 1 }}>
                                                        <div style={{ 
                                                            width: '48px', 
                                                            height: '48px', 
                                                            borderRadius: '50%', 
                                                            background: styleInfo.bg, 
                                                            border: `1px solid ${styleInfo.border}`,
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            fontSize: '1.5rem', 
                                                            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)',
                                                            flexShrink: 0
                                                        }}>
                                                            {styleInfo.icon}
                                                        </div>
                                                        <div style={{ minWidth: 0, flex: 1 }}>
                                                            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {formatTipo(mov.tipo)}
                                                                </span>
                                                                {mov.estado === 'ON_HOLD' && (
                                                                    <span style={{ 
                                                                        fontSize: '0.7rem', 
                                                                        background: 'rgba(255, 184, 77, 0.1)', 
                                                                        color: '#ffb84d', 
                                                                        padding: '0.2rem 0.6rem', 
                                                                        borderRadius: '20px', 
                                                                        border: '1px solid rgba(255, 184, 77, 0.2)',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.5px',
                                                                        whiteSpace: 'nowrap'
                                                                    }}>
                                                                        Pendiente
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {new Date(mov.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })} • {mov.descripcion}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ 
                                                        fontWeight: 800, 
                                                        color: mov.estado === 'ON_HOLD' ? '#ffb84d' : (mov.monto < 0 ? '#ff4d4d' : '#00C896'), 
                                                        fontSize: '1.2rem',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-end',
                                                        flexShrink: 0,
                                                        whiteSpace: 'nowrap',
                                                        marginLeft: '1.5rem'
                                                    }}>
                                                        <span>{mov.monto > 0 ? '+' : ''}{formatCurrency(mov.monto)}</span>
                                                        {mov.estado === 'ON_HOLD' && (
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.8, marginTop: '2px' }}>
                                                                En espera
                                                            </span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <WalletCards size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '1rem' }} />
                                        <h4 style={{ color: '#ccc', margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Sin transacciones aún</h4>
                                        <p style={{ color: '#666', margin: 0 }}>Gira la ruleta diaria o recibe un reembolso para ver tu historial aquí.</p>
                                    </div>
                                )}
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <RuletaModal
                isOpen={showRuleta}
                onClose={() => setShowRuleta(false)}
                onWin={(montoGanado) => {
                    setPerfil(prev => ({ ...prev, saldoFavor: prev.saldoFavor + montoGanado, fechaUltimoGiroRuleta: new Date().toISOString() }))
                    setSaldoLocal(prev => prev + montoGanado)
                    getMisMovimientos().then(r => setMovimientos(r.data)).catch(() => { })
                }}
            />

            <ConfettiCanvas activo={mostrarConfeti} tier={tierActual?.nombre || 'ORO'} />
            <CoinParticlesComponent />

            <AnimatePresence>
                {tierPromocion && (
                    <TierUpToast
                        mensaje={tierPromocion}
                        tier={tierActual?.nombre || 'ORO'}
                        onCerrar={() => {}}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default BilleteraPage;
