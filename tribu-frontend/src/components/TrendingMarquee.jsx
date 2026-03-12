/**
 * TrendingMarquee — banda animada de tendencias que aparece al hacer scroll.
 * Sin emojis — usa puntos separadores y colores para el efecto visual.
 */
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

const ITEMS = [
    'Gadget magnético', 'Auriculares inalámbricos', 'Mini proyector',
    'Luces LED RGB', 'Soporte ajustable', 'Lámpara de neón',
    'Control remoto inteligente', 'Anillo de luz', 'Altavoz portátil',
    'Cable retráctil magnético', 'Cargador inalámbrico', 'Ratón silencioso',
    'Teclado compacto', 'Cámara 4K portátil', 'Smartwatch deportivo',
]

const style = `
  @keyframes marqueeScroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .marquee-track {
    display: flex;
    width: max-content;
    animation: marqueeScroll 30s linear infinite;
  }
  .marquee-track:hover { animation-play-state: paused; }
`

export default function TrendingMarquee() {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            style={{
                padding: '1.5rem 0', overflow: 'hidden',
                borderTop: '1px solid rgba(255,87,34,0.12)',
                borderBottom: '1px solid rgba(255,87,34,0.12)',
                background: 'rgba(255,87,34,0.04)',
                marginBottom: '3rem',
            }}
        >
            <style>{style}</style>
            <div style={{ position: 'relative' }}>
                {/* Fade edges */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to right, var(--color-bg), transparent)', zIndex: 2, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to left, var(--color-bg), transparent)', zIndex: 2, pointerEvents: 'none' }} />

                <div style={{ overflow: 'hidden' }}>
                    <div className="marquee-track">
                        {[...ITEMS, ...ITEMS].map((item, i) => (
                            <div key={i} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.3rem 1.25rem', whiteSpace: 'nowrap',
                            }}>
                                <TrendingUp
                                    size={13}
                                    color={i % 3 === 0 ? 'var(--color-primary)' : i % 3 === 1 ? 'var(--color-accent-dark)' : 'var(--color-text-faint)'}
                                    strokeWidth={2.5}
                                />
                                <span style={{
                                    color: i % 3 === 0 ? 'var(--color-primary)' : i % 3 === 1 ? 'var(--color-accent-dark)' : 'var(--color-text-muted)',
                                    fontWeight: 600, fontSize: '0.9rem',
                                }}>
                                    {item}
                                </span>
                                <span style={{ opacity: 0.15, color: 'var(--color-text-muted)', fontSize: '1rem' }}>·</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.section>
    )
}
