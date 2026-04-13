import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WalletCards, CreditCard, Sparkles, Gift, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMiPerfil, getMisMovimientos } from '../api'
import RuletaModal from '../components/RuletaModal'
import { Link } from 'react-router-dom'
import { useNotification } from '../context/NotificationContext'
import { toast } from 'react-hot-toast'

import TribuCard from '../components/TribuCard'
import TribuCardMinting from '../components/TribuCardMinting'
import ConfettiCanvas from '../components/ConfettiCanvas'
import TierUpToast from '../components/TierUpToast'
import { useWebSocketAnimation } from '../hooks/useWebSocketAnimation'

const BilleteraPage = () => {
    const { user } = useAuth();
    const { saldoRealtime, notificaciones: notiContext, ultimoEvento, conectado } = useNotification();
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
        }).catch(() => { });
        getMisMovimientos().then(res => setMovimientos(res.data)).catch(() => { });
        if (localStorage.getItem(`tribu_card_created_${user.id}`) === 'true') {
            setTarjetaCreada(true);
        }
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
        setTimeout(() => {
            setIsCreating(false)
            setTarjetaCreada(true)
            localStorage.setItem(`tribu_card_created_${user.id}`, 'true')
        }, 3000)
    }

    const formatCurrency = (monto) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto || 0)

    const getCardNumber = () => {
        if (!user) return '•••• •••• •••• ••••'
        const seed = user.email.charCodeAt(0).toString().padStart(4, '0')
        return `5489 1234 9876 ${seed}`
    }

    if (!perfil) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Cargando...</div>

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingTop: '4rem', paddingBottom: '4rem' }}>
            <div className="container" style={{ maxWidth: 800 }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <WalletCards size={32} color="var(--color-primary)" /> Tribu Card
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', fontSize: '1.05rem' }}>
                            Tu saldo, tus devoluciones y tus premios en un solo lugar.
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            background: conectado ? '#00C896' : '#666',
                            boxShadow: conectado ? '0 0 10px #00C896' : 'none'
                        }} />
                        <span style={{ color: conectado ? '#00C896' : '#666', fontSize: '0.85rem', fontWeight: 600 }}>
                            {conectado ? 'En vivo' : 'Offline'}
                        </span>
                    </div>
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
                            style={{ background: 'rgba(20,20,20,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '3rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
                        >
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,87,34,0.15) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

                            <motion.div
                                animate={isCreating ? { rotateY: 360, scale: [1, 1.1, 1], filter: ['blur(0px)', 'blur(10px)', 'blur(0px)'] } : { y: [0, -10, 0] }}
                                transition={isCreating ? { duration: 2, ease: "easeInOut" } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                style={{
                                    width: '320px', height: '200px', margin: '0 auto 2rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
                                    borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                                }}
                            >
                                {isCreating ? (
                                    <Sparkles size={48} color="#FF5722" className="rotating" />
                                ) : (
                                    <CreditCard size={64} opacity={0.3} />
                                )}
                            </motion.div>

                            <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '1rem' }}>
                                {isCreating ? 'Emitiendo tu tarjeta virtual...' : 'Adquiere tu Tarjeta Virtual Tribu'}
                            </h2>
                            <p style={{ color: '#aaa', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
                                {isCreating
                                    ? 'Estamos configurando tus accesos de seguridad, encriptando los fondos y asignando un número único. Por favor espera.'
                                    : 'Activa tu tarjeta  ahora mismo para poder recibir reembolsos al instante por tus devoluciones, girar la ruleta por premios diarios y tener control total de tu dinero.'}
                            </p>

                            {!isCreating && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', fontSize: '0.9rem' }}><ShieldCheck size={18} color="#00C896" /> Emisión Gratuita</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', fontSize: '0.9rem' }}><Zap size={18} color="#ffb84d" /> Uso Instantáneo</div>
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
                            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                {canSpinToday() && (
                                    <motion.button
                                        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,87,34,0.6)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowRuleta(true)}
                                        style={{ background: 'linear-gradient(45deg, #FF5722, #FF9800)', border: 'none', padding: '1rem 2rem', borderRadius: '14px', color: '#fff', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', boxShadow: '0 8px 25px rgba(255,87,34,0.4)' }}
                                    >
                                        <Gift size={24} /> Ruleta Diaria
                                    </motion.button>
                                )}

                                <Link to="/transferir" style={{ textDecoration: 'none' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,200,150,0.4)' }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{ background: 'rgba(0, 200, 150, 0.1)', border: '1px solid rgba(0, 200, 150, 0.3)', padding: '1rem 2rem', borderRadius: '14px', color: '#00C896', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}
                                    >
                                        <Zap size={24} /> Transferir
                                    </motion.button>
                                </Link>
                            </div>

                            <div ref={cardRef} style={{ display: 'flex', justifyContent: 'center' }}>
                                <TribuCard
                                    saldo={saldoLocal ?? perfil?.saldoFavor ?? 0}
                                    animatorSaldo={animarSaldo}
                                    tierActual={tierActual}
                                />
                            </div>

                            {perfil.codigoReferido && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                    style={{ background: 'rgba(30,144,255,0.1)', border: '1px solid rgba(30,144,255,0.2)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '220px' }}>
                                        <h4 style={{ color: '#fff', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}><Sparkles size={18} color="#1E90FF" /> Trae a tu Tribu y gana Saldo</h4>
                                        <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                                            Dile a un amigo que se registre con tu código. Tú ganas <strong>$10.000 COP</strong> y ellos <strong>$5.000 COP</strong> directamente a su tarjeta virtual.
                                        </p>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '1px', fontFamily: 'monospace' }}>{perfil.codigoReferido}</span>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await navigator.clipboard.writeText(perfil.codigoReferido);
                                                    alert('¡Código copiado!');
                                                } catch (e) {
                                                    const textArea = document.createElement('textarea');
                                                    textArea.value = perfil.codigoReferido;
                                                    document.body.appendChild(textArea);
                                                    textArea.select();
                                                    document.execCommand('copy');
                                                    document.body.removeChild(textArea);
                                                    alert('¡Código copiado!');
                                                }
                                            }}
                                            className="btn btn-ghost"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                            Copiar
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            <div style={{ background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1.5rem', padding: '2rem' }}>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Últimos Movimientos
                                </h3>

                                {Array.isArray(movimientos) && movimientos.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {movimientos.map(mov => (
                                            <div key={mov.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1.2rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: (mov.tipo === 'PREMIO_RULETA' || mov.tipo === 'ROULETTE_REWARD') ? 'rgba(255, 87, 34, 0.15)' : 'rgba(0, 200, 150, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)' }}>
                                                        {(mov.tipo === 'PREMIO_RULETA' || mov.tipo === 'ROULETTE_REWARD') ? '🎁' :
                                                            (mov.tipo === 'WELCOME_BONUS' || mov.tipo === 'REGALO_BIENVENIDA') ? '🎉' :
                                                                (mov.tipo === 'REFERRAL_BONUS' || mov.tipo === 'REFERIDO_EXITOSO') ? '🤝' :
                                                                    <img src="/dinero.svg" alt="" style={{ width: '24px', height: '24px' }} />}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', textTransform: 'capitalize' }}>
                                                            {mov.tipo.replace('ROULETTE_REWARD', 'Premio Ruleta')
                                                                .replace('REFERRAL_BONUS', 'Bono Referido')
                                                                .replace('WELCOME_BONUS', 'Regalo Bienvenida')
                                                                .replace('PREMIO_RULETA', 'Premio Ruleta')
                                                                .replace('REFERIDO_EXITOSO', 'Bono Referido')
                                                                .replace('REGALO_BIENVENIDA', 'Regalo Bienvenida')
                                                                .replace('CASHBACK_COMPRA', 'Cashback')
                                                                .replace('CASHBACK', 'Cashback')
                                                                .replace('_', ' ').toLowerCase()}
                                                            {mov.estado === 'ON_HOLD' && (
                                                                <span style={{ 
                                                                    marginLeft: '0.8rem', 
                                                                    fontSize: '0.7rem', 
                                                                    background: 'rgba(255, 184, 77, 0.1)', 
                                                                    color: '#ffb84d', 
                                                                    padding: '0.2rem 0.6rem', 
                                                                    borderRadius: '20px', 
                                                                    border: '1px solid rgba(255, 184, 77, 0.2)',
                                                                    verticalAlign: 'middle',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.5px'
                                                                }}>
                                                                    Pendiente
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.2rem' }}>
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
                                                    alignItems: 'flex-end'
                                                }}>
                                                    <span>{mov.monto > 0 ? '+' : ''}{formatCurrency(mov.monto)}</span>
                                                    {mov.estado === 'ON_HOLD' && (
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.8, marginTop: '2px' }}>
                                                            En espera
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
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
