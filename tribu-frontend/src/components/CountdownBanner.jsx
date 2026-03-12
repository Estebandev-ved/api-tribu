/**
 * CountdownBanner — mejoras de conversión:
 * + Micro-texto "¡Aprovéchalo antes de que se acabe!" debajo del contador
 * + Contador real sincronizado a medianoche
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, X } from 'lucide-react'

function getSecondsUntilMidnight() {
    const now = new Date()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    return Math.floor((midnight - now) / 1000)
}

function formatTime(secs) {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0')
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return { h, m, s }
}

export default function CountdownBanner() {
    const [secs, setSecs] = useState(getSecondsUntilMidnight)
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        if (!visible) return
        const id = setInterval(() => setSecs(s => s > 0 ? s - 1 : getSecondsUntilMidnight()), 1000)
        return () => clearInterval(id)
    }, [visible])

    if (!visible) return null
    const { h, m, s } = formatTime(secs)

    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.8 }}
            style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #c0392b 100%)',
                padding: '0.5rem 1rem',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '0.2rem', position: 'relative', zIndex: 101,
            }}
        >
            {/* Fila principal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.85rem', color: '#fff' }}>
                    <Flame size={15} /> OFERTA DEL DÍA — Envío gratis en pedidos +$80.000
                </span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>Termina en:</span>

                {/* Dígitos del contador */}
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    {[{ v: h, l: 'H' }, { v: m, l: 'M' }, { v: s, l: 'S' }].map(({ v, l }, i) => (
                        <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <AnimatePresence mode="popLayout">
                                <motion.span
                                    key={v}
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 10, opacity: 0 }}
                                    transition={{ duration: 0.22 }}
                                    style={{
                                        background: 'rgba(0,0,0,0.28)', borderRadius: 6,
                                        padding: '2px 9px', fontFamily: 'Outfit, sans-serif',
                                        fontWeight: 900, fontSize: '1rem', color: '#fff', minWidth: 33, textAlign: 'center',
                                        border: '1px solid rgba(255,255,255,0.18)',
                                        display: 'block',
                                    }}
                                >{v}</motion.span>
                            </AnimatePresence>
                            <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.06em', marginTop: 1 }}>{l}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Micro-texto de urgencia */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                style={{
                    fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)',
                    fontStyle: 'italic', letterSpacing: '0.02em', margin: 0,
                }}
            >
                ¡Aprovéchalo antes de que se acabe!
            </motion.p>

            {/* Botón cerrar */}
            <motion.button
                onClick={() => setVisible(false)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center',
                }}
            >
                <X size={16} />
            </motion.button>
        </motion.div>
    )
}
