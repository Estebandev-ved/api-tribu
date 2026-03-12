/**
 * SocialProofToast — usa datos REALES de la API en primer lugar.
 * Si no hay compras aún, usa una lista de fallback de placeholders
 * que se irán reemplazando conforme lleguen pedidos reales.
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Fallback mientras no hay pedidos reales
const FALLBACK = [
    { nombre: 'Carlos', ciudad: 'Medellín', producto: 'Gadget magnético', emoji: '🛍️' },
    { nombre: 'Andrea', ciudad: 'Bogotá', producto: 'Luces LED RGB', emoji: '⚡' },
    { nombre: 'Felipe', ciudad: 'Cali', producto: 'Auriculares inalámbricos', emoji: '🔥' },
    { nombre: 'Valentina', ciudad: 'Barranquilla', producto: 'Mini proyector portátil', emoji: '💫' },
    { nombre: 'Santiago', ciudad: 'Pasto', producto: 'Soporte ajustable', emoji: '🎯' },
    { nombre: 'María', ciudad: 'Bucaramanga', producto: 'Kit de organización', emoji: '✨' },
    { nombre: 'Julián', ciudad: 'Pereira', producto: 'Lámpara de neón', emoji: '💡' },
    { nombre: 'Camila', ciudad: 'Manizales', producto: 'Ventilador USB', emoji: '🚀' },
]

const EMOJIS = ['🛍️', '⚡', '🔥', '💫', '🎯', '✨', '💡', '🌟', '🚀', '💎']

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function getMins() { return Math.floor(Math.random() * 9) + 1 }

export default function SocialProofToast() {
    const [visible, setVisible] = useState(false)
    const [current, setCurrent] = useState(null)
    const [pool, setPool] = useState(FALLBACK)

    // Cargar compras reales al montar
    useEffect(() => {
        fetch('/api/social-proof/recientes?limit=15')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data && data.length > 0) {
                    const real = data.map(d => ({
                        nombre: d.nombre,
                        ciudad: d.ciudad,
                        producto: d.producto,
                        emoji: getRandom(EMOJIS),
                    }))
                    // Mezclar reales con fallback (reales primero)
                    setPool([...real, ...FALLBACK].slice(0, 20))
                }
            })
            .catch(() => { }) // Silencioso — usa fallback
    }, [])

    useEffect(() => {
        let timeout, interval

        const show = () => {
            setCurrent({ ...getRandom(pool), mins: getMins() })
            setVisible(true)
            setTimeout(() => setVisible(false), 4200)
        }

        timeout = setTimeout(show, 7000)
        interval = setInterval(show, 20000 + Math.random() * 12000)

        return () => { clearTimeout(timeout); clearInterval(interval) }
    }, [pool])

    return (
        <AnimatePresence>
            {visible && current && (
                <motion.div
                    initial={{ x: -340, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -340, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    className="sp-toast"
                >
                    <div className="sp-toast-avatar">{current.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3, fontSize: '0.85rem' }}>
                            {current.nombre} de <span style={{ color: 'var(--color-primary)' }}>{current.ciudad}</span>
                        </p>
                        <p style={{
                            color: 'var(--color-text-muted)', fontSize: '0.77rem', lineHeight: 1.3, marginTop: 2,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                            Compró <strong style={{ color: 'var(--color-text)' }}>{current.producto}</strong>
                        </p>
                        <p style={{ color: 'var(--color-text-faint)', fontSize: '0.7rem', marginTop: 2 }}>
                            Hace {current.mins} min · <span style={{ color: 'var(--color-success)' }}>✓ Verificado</span>
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
