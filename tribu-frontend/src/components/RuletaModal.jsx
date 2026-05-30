import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, ShieldAlert, Check, Sparkles, Copy, Truck, Ticket, RotateCw } from 'lucide-react'
import { girarRuleta, girarRuletaConPuntos } from '../api'
import toast from 'react-hot-toast'

const AGE_KEY = 'tribu_age_verified_ruleta'

export default function RuletaModal({ isOpen, onClose, onWin }) {
    const [girando, setGirando] = useState(false)
    const [rotacion, setRotacion] = useState(0)
    const [premioGanado, setPremioGanado] = useState(null)
    const [premioDetallado, setPremioDetallado] = useState(null)
    const [copied, setCopied] = useState(false)
    const [ageVerified, setAgeVerified] = useState(() => sessionStorage.getItem(AGE_KEY) === 'true')

    const segmentos = [
        { label: '0 pts', val: 0, color: '#E11D48', type: 'NADA' },
        { label: '500 pts', val: 500, color: '#3B82F6', type: 'PUNTOS' },
        { label: '1.000 pts', val: 1000, color: '#10B981', type: 'PUNTOS' },
        { label: '2.000 pts', val: 2000, color: '#8B5CF6', type: 'PUNTOS' },
        { label: '10% Dto 🏷️', val: 3000, color: '#EC4899', type: 'DESCUENTO' },
        { label: 'Envío Gratis 🚚', val: 4000, color: '#F59E0B', type: 'ENVIO_GRATIS' },
        { label: '¡Regalo! 🎁', val: 5000, color: '#06B6D4', type: 'PRODUCTO' },
        { label: '0 pts', val: 0, color: '#F97316', type: 'NADA' }
    ];

    const handleGirar = async () => {
        if (girando) return
        setGirando(true)
        setPremioGanado(null)
        setPremioDetallado(null)
        setCopied(false)

        try {
            const { data } = await girarRuleta()
            ejecutarGiroRuleta(data)
        } catch (error) {
            setGirando(false)
            if (error.response?.data?.mensaje) {
                toast.error(error.response.data.mensaje)
            } else {
                toast.error('Error al girar la ruleta.')
            }
        }
    }

    const handleGirarConPuntos = async () => {
        if (girando) return
        setGirando(true)
        setPremioGanado(null)
        setPremioDetallado(null)
        setCopied(false)

        try {
            const { data } = await girarRuletaConPuntos()
            ejecutarGiroRuleta(data)
        } catch (error) {
            setGirando(false)
            if (error.response?.data?.mensaje) {
                toast.error(error.response.data.mensaje)
            } else {
                toast.error('Error al comprar giro con puntos.')
            }
        }
    }

    const ejecutarGiroRuleta = (data) => {
        // Buscar índice del premio ganado
        // Si hay repetidos (ej. 0 pts), agarramos uno al azar de los coincidentes
        const indicesValidos = segmentos.map((s, i) => s.val === data.premio ? i : -1).filter(i => i !== -1)
        const indexPremio = indicesValidos[Math.floor(Math.random() * indicesValidos.length)]

        // Calcular rotación
        const gradosPorSegmento = 360 / segmentos.length // 45 grados por segmento
        const girosExtra = 6 * 360 // Dar 6 vueltas completas
        
        // Offset adicional para que el centro del premio caiga en el puntero (arriba = 0 grados)
        const anguloCentroPremio = (indexPremio * gradosPorSegmento) + (gradosPorSegmento / 2)
        const nuevaRotacion = rotacion + girosExtra + (360 - anguloCentroPremio)

        setRotacion(nuevaRotacion)

        // Esperar a que acabe la animación (4s)
        setTimeout(() => {
            setGirando(false)
            setPremioGanado(data.premio)
            setPremioDetallado(data)
            
            if (data.premio > 0) {
                toast.success(`¡Felicidades! Ganaste ${data.labelPremio}`)
                if (onWin) onWin(data.premio)
            } else {
                toast.error('¡Casi! Inténtalo de nuevo.')
            }
        }, 4000)
    }

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        toast.success('¡Código copiado al portapapeles! 📋')
        setTimeout(() => setCopied(false), 2000)
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
                    zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>

                <motion.div
                    initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                    style={{
                        background: 'linear-gradient(135deg, #151520 0%, #0d0d15 100%)', width: '92%', maxWidth: '440px',
                        borderRadius: '32px', padding: '2rem', position: 'relative',
                        boxShadow: '0 25px 60px -10px rgba(98,67,255,0.25), 0 0 40px rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        textAlign: 'center',
                        overflow: 'hidden'
                    }}>

                    {/* Efecto de brillo de fondo */}
                    <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '30%', background: 'radial-gradient(circle, rgba(98, 67, 255, 0.15) 0%, transparent 80%)', pointerEvents: 'none', zIndex: 0 }} />

                    <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', zIndex: 10 }} onMouseEnter={(e)=>e.target.style.background='rgba(255,255,255,0.1)'} onMouseLeave={(e)=>e.target.style.background='rgba(255,255,255,0.05)'}>
                        <X size={20} />
                    </button>

                    {!ageVerified ? (
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: '20px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                                <ShieldAlert size={32} color="#EF4444" />
                            </div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem', color: '#EF4444', fontFamily: 'Outfit, sans-serif' }}>
                                Verificación de Edad
                            </h2>
                            <p style={{ fontSize: '0.9rem', color: '#aaa', lineHeight: 1.6, marginBottom: '1.2rem' }}>
                                La ruleta es una mecánica de gamificación exclusiva para{' '}
                                <strong style={{ color: '#fff' }}>mayores de 18 años</strong>.
                            </p>
                            <div style={{
                                background: 'rgba(245, 158, 11, 0.06)',
                                border: '1px solid rgba(245, 158, 11, 0.12)',
                                borderRadius: '16px',
                                padding: '0.8rem 1.2rem',
                                marginBottom: '2rem'
                            }}>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: '#F59E0B', lineHeight: 1.5, textAlign: 'left' }}>
                                    ⚠️ Los premios de la ruleta se otorgan en puntos para compras y códigos de fidelización sin valor comercial externo. 1 giro gratuito al día.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    sessionStorage.setItem(AGE_KEY, 'true')
                                    setAgeVerified(true)
                                }}
                                style={{
                                    width: '100%', padding: '1rem',
                                    background: 'linear-gradient(135deg, #FF5722, #FF9800)',
                                    color: '#fff', border: 'none', borderRadius: '16px',
                                    fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    boxShadow: '0 8px 24px rgba(255,87,34,0.35)'
                                }}
                            >
                                <Check size={20} /> Confirmar Mayoría de Edad
                            </button>
                        </div>
                    ) : (
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'inline-flex', background: 'rgba(255,87,34,0.08)', padding: '0.4rem 1rem', borderRadius: '100px', border: '1px solid rgba(255,87,34,0.2)', marginBottom: '0.8rem', alignItems: 'center', gap: '0.4rem' }}>
                                <Sparkles size={14} color="var(--color-primary)" />
                                <span style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Ruleta de la Tribu</span>
                            </div>
                            
                            <h2 style={{ fontSize: '1.7rem', fontWeight: 900, marginBottom: '0.4rem', color: '#fff', fontFamily: 'Outfit, sans-serif' }}>¡Gira y Gana!</h2>
                            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1.8rem', lineHeight: 1.4 }}>
                                Gira gratis diariamente para obtener premios. ¡O usa tus puntos acumulados para seguir jugando sin límites!
                            </p>

                            {/* Contenedor Ruleta Premium */}
                            <div style={{ position: 'relative', width: '270px', height: '270px', margin: '0 auto 2.2rem' }}>
                                {/* Puntero / Indicador superior premium */}
                                <div style={{
                                    position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)',
                                    width: 0, height: 0, borderLeft: '16px solid transparent', borderRight: '16px solid transparent',
                                    borderTop: '26px solid #fff', zIndex: 20, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))'
                                }} />
                                {/* Halo de luz detrás de la ruleta */}
                                <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', background: 'radial-gradient(circle, rgba(98, 67, 255, 0.2) 0%, transparent 70%)', zIndex: 0 }} />

                                <motion.div
                                    animate={{ rotate: rotacion }}
                                    transition={{ duration: 4, type: 'tween', ease: 'circOut' }}
                                    style={{
                                        width: '100%', height: '100%', borderRadius: '50%',
                                        position: 'relative', overflow: 'hidden',
                                        border: '6px solid rgba(255,255,255,0.08)',
                                        boxShadow: '0 0 30px rgba(0,0,0,0.8), 0 0 15px rgba(98,67,255,0.2) inset',
                                        zIndex: 1
                                    }}>
                                    <div style={{
                                        position: 'absolute', width: '100%', height: '100%',
                                        background: `conic-gradient(
                                            ${segmentos[0].color} 0deg 45deg,
                                            ${segmentos[1].color} 45deg 90deg,
                                            ${segmentos[2].color} 90deg 135deg,
                                            ${segmentos[3].color} 135deg 180deg,
                                            ${segmentos[4].color} 180deg 225deg,
                                            ${segmentos[5].color} 225deg 270deg,
                                            ${segmentos[6].color} 270deg 315deg,
                                            ${segmentos[7].color} 315deg 360deg
                                        )`
                                    }} />

                                    {segmentos.map((s, i) => {
                                        const angulo = (i * 45) + 22.5;
                                        return (
                                            <div key={i} style={{
                                                position: 'absolute', width: '50%', height: '24px',
                                                top: 'calc(50% - 12px)', left: '50%',
                                                transformOrigin: '0% 50%',
                                                transform: `rotate(${angulo - 90}deg)`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                paddingLeft: '18px', boxSizing: 'border-box'
                                            }}>
                                                <span style={{ 
                                                    color: 'white', 
                                                    fontWeight: 900, 
                                                    fontSize: s.label.length > 8 ? '0.72rem' : '0.82rem', 
                                                    textShadow: '0 2px 5px rgba(0,0,0,0.9)',
                                                    letterSpacing: '-0.2px'
                                                }}>
                                                    {s.label}
                                                </span>
                                            </div>
                                        )
                                    })}

                                    {/* Centro de la ruleta premium */}
                                    <div style={{
                                        position: 'absolute', width: '22%', height: '22%',
                                        top: '39%', left: '39%', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #1f1f2e, #0d0d15)', 
                                        border: '4px solid #fff',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        zIndex: 10
                                    }}>
                                        <Gift size={20} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                                    </div>
                                </motion.div>
                            </div>

                            {/* Controles de Juego */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <motion.button
                                    whileHover={!girando ? { scale: 1.03, boxShadow: '0 10px 25px rgba(255,87,34,0.3)' } : {}}
                                    whileTap={!girando ? { scale: 0.98 } : {}}
                                    onClick={handleGirar}
                                    disabled={girando}
                                    className="btn btn-primary"
                                    style={{ 
                                        width: '100%', fontSize: '1.1rem', padding: '1rem', 
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', 
                                        gap: '0.6rem', fontWeight: 900, letterSpacing: '0.5px' 
                                    }}>
                                    {girando ? (
                                        <>
                                            <RotateCw className="spinner" size={20} style={{ animation: 'spin 1s linear infinite' }} />
                                            <span>Girando ruleta...</span>
                                        </>
                                    ) : (
                                        <>
                                            <RotateCw size={20} />
                                            <span>Giro Diario Gratis</span>
                                        </>
                                    )}
                                </motion.button>

                                <motion.button
                                    whileHover={!girando ? { scale: 1.02, background: 'rgba(98, 67, 255, 0.25)' } : {}}
                                    whileTap={!girando ? { scale: 0.98 } : {}}
                                    onClick={handleGirarConPuntos}
                                    disabled={girando}
                                    style={{
                                        width: '100%', fontSize: '0.92rem', padding: '0.9rem',
                                        background: 'rgba(98, 67, 255, 0.12)',
                                        border: '1px solid rgba(98, 67, 255, 0.35)',
                                        color: '#b7a9ff', fontWeight: 800, cursor: 'pointer',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                                        borderRadius: '16px', transition: 'all 0.2s'
                                    }}
                                >
                                    <Sparkles size={16} color="#b7a9ff" />
                                    <span>Girar de Nuevo (2.000 pts)</span>
                                </motion.button>
                            </div>

                            {/* Mostrar Premio Ganado con UI Espectacular y Copia de Cupones */}
                            {premioDetallado && !girando && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }} 
                                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                                    style={{ 
                                        marginTop: '2rem', 
                                        background: 'rgba(255,255,255,0.03)', 
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '20px',
                                        padding: '1.25rem'
                                    }}
                                >
                                    {premioDetallado.premio > 0 ? (
                                        <div>
                                            <div style={{ display: 'inline-flex', background: 'rgba(16, 185, 129, 0.1)', padding: '0.35rem 0.8rem', borderRadius: '100px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '0.8rem', alignItems: 'center', gap: '0.4rem' }}>
                                                <Sparkles size={14} color="#10B981" />
                                                <span style={{ color: '#10B981', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase' }}>¡Premio Acreditado!</span>
                                            </div>
                                            
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: '0 0 0.5rem 0' }}>
                                                Ganaste {premioDetallado.labelPremio}
                                            </h3>
                                            
                                            <p style={{ color: '#aaa', fontSize: '0.8rem', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
                                                Se han acreditado <strong>{premioDetallado.premio} pts</strong> de saldo directo en tu Tribu Card.
                                            </p>

                                            {/* Si es un cupón, mostrar código para copiar */}
                                            {premioDetallado.codigoPremio && (
                                                <div style={{
                                                    background: 'rgba(0,0,0,0.3)',
                                                    border: '1px dashed rgba(255,255,255,0.15)',
                                                    borderRadius: '12px',
                                                    padding: '0.8rem 1rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '1rem',
                                                    marginTop: '0.5rem'
                                                }}>
                                                    <div style={{ textAlign: 'left' }}>
                                                        <span style={{ fontSize: '0.62rem', color: '#777', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Código de Canje</span>
                                                        <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary)', letterSpacing: '1px' }}>{premioDetallado.codigoPremio}</strong>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleCopy(premioDetallado.codigoPremio)}
                                                        style={{
                                                            background: copied ? '#10B981' : 'rgba(255,255,255,0.06)',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            width: '36px', height: '36px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            color: '#fff',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>
                                                🍀 Casi... ¡No te rindas! Inténtalo de nuevo.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
