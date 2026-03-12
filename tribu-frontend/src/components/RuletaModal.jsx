import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift } from 'lucide-react'
import { girarRuleta } from '../api'
import toast from 'react-hot-toast'

export default function RuletaModal({ isOpen, onClose, onWin }) {
    const [girando, setGirando] = useState(false)
    const [rotacion, setRotacion] = useState(0)
    const [premioGanado, setPremioGanado] = useState(null)

    const segmentos = [
        { label: '$0', val: 0, color: '#FF5722' },
        { label: '$1.000', val: 1000, color: '#4facfe' },
        { label: '$2.000', val: 2000, color: '#00C896' },
        { label: '$5.000', val: 5000, color: '#9c27b0' },
        { label: '$10.000', val: 10000, color: '#FFD700' },
        { label: '$0', val: 0, color: '#ff9800' },
    ]

    const handleGirar = async () => {
        if (girando) return
        setGirando(true)
        setPremioGanado(null)

        try {
            const { data } = await girarRuleta()

            // Buscar índice del premio ganado
            // Si hay repetidos (ej. $0), agarramos uno al azar de los coincidentes
            const indicesValidos = segmentos.map((s, i) => s.val === data.premio ? i : -1).filter(i => i !== -1)
            const indexPremio = indicesValidos[Math.floor(Math.random() * indicesValidos.length)]

            // Calcular rotación
            // Ruleta tiene 6 segmentos, 60 grados cada uno
            // Queremos que el segmento ganador quede arriba (270 grados absolutos o similar dependiendo de cómo se dibuje)
            const gradosPorSegmento = 360 / segmentos.length
            const girosExtra = 5 * 360 // Dar 5 vueltas completas
            // Offset adicional para que el centro del premio caiga en el puntero (arriba = 0 grados en nuestro renderizado css, así que usamos 360 - centro)
            const anguloCentroPremio = (indexPremio * gradosPorSegmento) + (gradosPorSegmento / 2)
            const nuevaRotacion = rotacion + girosExtra + (360 - anguloCentroPremio)

            setRotacion(nuevaRotacion)

            // Esperar a que acabe la animación (4s)
            setTimeout(() => {
                setGirando(false)
                setPremioGanado(data.premio)
                if (data.premio > 0) {
                    toast.success(`¡Felicidades! Ganaste ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(data.premio)}`)
                    if (onWin) onWin(data.premio)
                } else {
                    toast.error('¡Casi! Inténtalo de nuevo mañana.')
                }
            }, 4000)

        } catch (error) {
            setGirando(false)
            if (error.response?.data?.mensaje) {
                toast.error(error.response.data.mensaje)
            } else {
                toast.error('Error al girar la ruleta.')
            }
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
                    zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>

                <motion.div
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    style={{
                        background: 'var(--color-surface)', width: '90%', maxWidth: '400px',
                        borderRadius: '24px', padding: '2rem', position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(255,87,34,0.25)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        textAlign: 'center'
                    }}>

                    <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#FF5722' }}>Ruleta Tribu</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                        Gira una vez al día para ganar saldo para tu próxima compra.
                    </p>

                    {/* Contenedor Ruleta */}
                    <div style={{ position: 'relative', width: '250px', height: '250px', margin: '0 auto 2rem' }}>
                        {/* Puntero */}
                        <div style={{
                            position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)',
                            width: 0, height: 0, borderLeft: '15px solid transparent', borderRight: '15px solid transparent',
                            borderTop: '25px solid white', zIndex: 10, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))'
                        }} />

                        {/* Rueda circular */}
                        <motion.div
                            animate={{ rotate: rotacion }}
                            transition={{ duration: 4, type: 'tween', ease: 'circOut' }}
                            style={{
                                width: '100%', height: '100%', borderRadius: '50%',
                                position: 'relative', overflow: 'hidden',
                                border: '4px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 0 20px rgba(0,0,0,0.5) inset'
                            }}>
                            {/* Conic Gradient CSS Trick para los segmentos */}
                            <div style={{
                                position: 'absolute', width: '100%', height: '100%',
                                background: `conic-gradient(
                                    ${segmentos[0].color} 0deg 60deg,
                                    ${segmentos[1].color} 60deg 120deg,
                                    ${segmentos[2].color} 120deg 180deg,
                                    ${segmentos[3].color} 180deg 240deg,
                                    ${segmentos[4].color} 240deg 300deg,
                                    ${segmentos[5].color} 300deg 360deg
                                )`
                            }} />

                            {/* Textos de los segmentos */}
                            {segmentos.map((s, i) => {
                                const angulo = (i * 60) + 30; // Centro geométrico del segmento
                                return (
                                    <div key={i} style={{
                                        position: 'absolute', width: '50%', height: '20px',
                                        top: 'calc(50% - 10px)', left: '50%',
                                        transformOrigin: '0% 50%',
                                        transform: `rotate(${angulo - 90}deg)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        paddingLeft: '20px', boxSizing: 'border-box'
                                    }}>
                                        <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                            {s.label}
                                        </span>
                                    </div>
                                )
                            })}

                            {/* Centro decorativo */}
                            <div style={{
                                position: 'absolute', width: '20%', height: '20%',
                                top: '40%', left: '40%', borderRadius: '50%',
                                background: 'white', border: '5px solid #222',
                                display: 'flex', justifyContent: 'center', alignItems: 'center'
                            }}>
                                <Gift size={20} color="#FF5722" />
                            </div>
                        </motion.div>
                    </div>

                    <button
                        onClick={handleGirar}
                        disabled={girando}
                        className="btn-primary"
                        style={{ width: '100%', fontSize: '1.1rem', padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        {girando ? 'Girando...' : '¡Girar Ahora!'}
                    </button>

                    {premioGanado !== null && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1rem', color: premioGanado > 0 ? '#00C896' : '#FF5722', fontWeight: 600 }}>
                            {premioGanado > 0 ? `Ganaste ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(premioGanado)}` : 'Sigue intentándolo'}
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
