import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WalletCards, CreditCard, Sparkles, Gift, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMiPerfil, getMisMovimientos } from '../api'
import RuletaModal from '../components/RuletaModal'
import { Link } from 'react-router-dom'

export default function BilleteraPage() {
    const { user } = useAuth()
    const [perfil, setPerfil] = useState(null)
    const [movimientos, setMovimientos] = useState([])
    const [tarjetaCreada, setTarjetaCreada] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [showRuleta, setShowRuleta] = useState(false)

    useEffect(() => {
        if (!user) return
        getMiPerfil().then(res => setPerfil(res.data)).catch(() => { })
        getMisMovimientos().then(res => setMovimientos(res.data)).catch(() => { })
        if (localStorage.getItem(`tribu_card_created_${user.id}`) === 'true') {
            setTarjetaCreada(true)
        }
    }, [user])

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
        // Simulamos un proceso de validación y emisión de tarjeta
        setTimeout(() => {
            setIsCreating(false)
            setTarjetaCreada(true)
            localStorage.setItem(`tribu_card_created_${user.id}`, 'true')
        }, 3000)
    }

    // Funciones de formato
    const formatCurrency = (monto) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto || 0)

    // Generar un número de tarjeta mock basado en el ID o email del usuario
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
                </div>

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
                            {/* Bg Glow */}
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
                            {/* HEADER ACTIONS */}
                            {canSpinToday() && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,87,34,0.6)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowRuleta(true)}
                                        style={{ background: 'linear-gradient(45deg, #FF5722, #FF9800)', border: 'none', padding: '1rem 2rem', borderRadius: '14px', color: '#fff', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', boxShadow: '0 8px 25px rgba(255,87,34,0.4)' }}
                                    >
                                        <Gift size={24} /> ¡Tirar la Ruleta Diaria!
                                    </motion.button>
                                </motion.div>
                            )}

                            {/* TRIBU CARD VISUALIZATION DEPENDIENDO DEL NIVEL VIP */}
                            <motion.div
                                whileHover={{ scale: 1.01, rotateX: 2, rotateY: -2 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                style={{
                                    background: perfil.nivelVip === 3
                                        ? 'linear-gradient(135deg, #FFB75E, #ED8F03, #c27202)' // ORO
                                        : perfil.nivelVip === 2
                                            ? 'linear-gradient(135deg, #E0EAFC, #CFDEF3, #a1aebf)' // PLATA
                                            : 'linear-gradient(135deg, #2b2b36, #1f1f26, #14141a)', // BRONCE (Oscuro/Minimalista)
                                    backdropFilter: 'blur(30px)', border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '24px', padding: '2.5rem', position: 'relative', overflow: 'hidden',
                                    boxShadow: perfil.nivelVip === 3 ? '0 20px 50px rgba(237,143,3,0.4), inset 0 0 0 1px rgba(255,255,255,0.3)' : '0 20px 50px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
                                    aspectRatio: '1.586 / 1', /* Proporción estándar de tarjeta de crédito dorada */
                                    maxWidth: '480px', margin: '0 auto', /* Centrar y limitar tamaño en desktop */
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                    color: perfil.nivelVip >= 2 ? '#222' : '#fff' // Texto oscuro para Plata y Oro
                                }}>

                                {/* Glass Reflections con ajuste VIP */}
                                <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.25) 0%, transparent 40%)', pointerEvents: 'none' }} />
                                <div style={{ position: 'absolute', bottom: '-20%', right: '-20%', width: '150%', height: '150%', background: perfil.nivelVip === 3 ? 'radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.4) 0%, transparent 50%)' : 'radial-gradient(circle at bottom right, rgba(255, 87, 34, 0.2) 0%, transparent 50%)', pointerEvents: 'none' }} />

                                {/* Chip and Logo */}
                                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ width: '50px', height: '35px', background: 'linear-gradient(135deg, #ffd700, #b8860b)', borderRadius: '6px', opacity: 0.9, position: 'relative', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                                        <div style={{ position: 'absolute', top: '50%', width: '100%', height: '1px', background: 'rgba(0,0,0,0.2)' }} />
                                        <div style={{ position: 'absolute', left: '50%', width: '1px', height: '100%', background: 'rgba(0,0,0,0.2)' }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', opacity: 0.9 }}>
                                        <h3 style={{ margin: 0, color: 'inherit', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '2px', fontStyle: 'italic' }}>TRIBU</h3>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', padding: '2px 6px', borderRadius: '4px', background: perfil.nivelVip >= 2 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
                                            {perfil.nivelVip === 3 ? 'Gold' : perfil.nivelVip === 2 ? 'Silver' : 'Standard'}
                                        </span>
                                    </div>
                                </div>

                                {/* Balance & Number */}
                                <div style={{ position: 'relative', zIndex: 1, marginTop: '1rem' }}>
                                    <div style={{ color: perfil.nivelVip >= 2 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem', fontWeight: 600 }}>Balance Actual</div>
                                    <div style={{ fontSize: '3rem', fontWeight: 900, color: 'inherit', textShadow: perfil.nivelVip >= 2 ? 'none' : '0 2px 10px rgba(0,0,0,0.5)', lineHeight: 1 }}>
                                        {formatCurrency(perfil.saldoFavor)}
                                    </div>
                                </div>

                                {/* Footer of Card */}
                                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1.5rem' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: perfil.nivelVip >= 2 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)', letterSpacing: '3px', textTransform: 'uppercase' }}>
                                        {user.nombreCompleto}
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: perfil.nivelVip >= 2 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)', letterSpacing: '4px', fontFamily: 'monospace' }}>
                                        {getCardNumber()}
                                    </div>
                                </div>
                            </motion.div>

                            {/* PANEL DE REFERIDOS (TRAE A TU TRIBU) */}
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
                                            onClick={() => {
                                                navigator.clipboard.writeText(perfil.codigoReferido);
                                                alert('¡Código copiado!');
                                            }}
                                            className="btn btn-ghost"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                            Copiar
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* MOVIMIENTOS HISTORIAL */}
                            <div style={{ background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1.5rem', padding: '2rem' }}>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Últimos Movimientos
                                </h3>

                                {movimientos.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {movimientos.map(mov => (
                                            <div key={mov.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1.2rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: mov.tipo === 'PREMIO_RULETA' ? 'rgba(255, 87, 34, 0.15)' : 'rgba(0, 200, 150, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)' }}>
                                                        {mov.tipo === 'PREMIO_RULETA' ? '🎁' : <img src="/dinero.svg" alt="" style={{ width: '24px', height: '24px' }} />}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', textTransform: 'capitalize' }}>
                                                            {mov.tipo.replace('_', ' ').toLowerCase()}
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.2rem' }}>
                                                            {new Date(mov.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })} • {mov.descripcion}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: 800, color: '#00C896', fontSize: '1.2rem' }}>
                                                    +{formatCurrency(mov.monto)}
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
                    getMisMovimientos().then(r => setMovimientos(r.data)).catch(() => { })
                }}
            />
        </div>
    )
}
