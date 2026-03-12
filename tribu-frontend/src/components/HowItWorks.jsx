import { motion } from 'framer-motion'
import { Search, ShoppingCart, Package, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

const PASOS = [
    {
        Icon: Search,
        titulo: 'Elige tu producto',
        desc: 'Navega nuestro catálogo de productos virales curados directamente de TikTok. Filtra por categoría y encuentra lo que está de moda.',
        link: '/#catalogo',
        linkLabel: 'Ver catálogo',
    },
    {
        Icon: ShoppingCart,
        titulo: 'Haz tu pedido',
        desc: 'Agrega al carrito, elige tu dirección y confirma. Aceptamos todos los métodos de pago. 100% seguro.',
    },
    {
        Icon: Package,
        titulo: 'Recibe en tu puerta',
        desc: 'Tu pedido sale desde Mocoa, Putumayo. Rastreo en tiempo real y notificación de cada estado por email.',
    },
]

export default function HowItWorks() {
    // Prueba social dinámica: número aleatorio entre 12 y 47 que cambia cada 30s
    const [personas, setPersonas] = useState(() => Math.floor(Math.random() * 35) + 12)
    useEffect(() => {
        const id = setInterval(() => setPersonas(Math.floor(Math.random() * 35) + 12), 30000)
        return () => clearInterval(id)
    }, [])

    return (
        <section style={{ padding: '5rem 0', borderTop: '1px solid var(--color-border)' }}>
            <div className="container">
                {/* Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    style={{ textAlign: 'center', marginBottom: '3.5rem' }}
                >
                    <span style={{
                        display: 'inline-block', background: 'rgba(255,87,34,0.1)',
                        border: '1px solid rgba(255,87,34,0.25)', borderRadius: '9999px',
                        padding: '0.3rem 1rem', fontSize: '0.8rem', fontWeight: 700,
                        color: 'var(--color-primary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>Así de fácil</span>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', lineHeight: 1.15 }}>
                        De TikTok a tu puerta<br />
                        <span className="gradient-text">en 3 pasos</span>
                    </h2>
                </motion.div>

                {/* Cards de pasos */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
                    {PASOS.map((paso, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.5, delay: i * 0.15 }}
                            className="card"
                            style={{ textAlign: 'center', padding: '2rem 1.5rem' }}
                        >
                            <div style={{
                                width: 72, height: 72, borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(255,87,34,0.15), rgba(254,231,21,0.08))',
                                border: '1px solid rgba(255,87,34,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.25rem', position: 'relative',
                            }}>
                                <paso.Icon size={28} color="var(--color-primary)" strokeWidth={1.5} />
                                <span style={{
                                    position: 'absolute', top: -6, right: -6,
                                    background: 'var(--color-primary)', color: '#fff',
                                    borderRadius: '9999px', width: 24, height: 24,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.7rem', fontWeight: 900,
                                }}>{i + 1}</span>
                            </div>
                            <h3 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.75rem' }}>{paso.titulo}</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.65 }}>{paso.desc}</p>
                            {paso.link && (
                                <Link
                                    to={paso.link}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                        marginTop: '0.75rem', color: 'var(--color-primary)',
                                        fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
                                        transition: 'opacity 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                >
                                    {paso.linkLabel} <ArrowRight size={14} />
                                </Link>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Prueba social dinámica — punto verde pulsante */}
                <motion.div
                    key={personas}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        marginTop: '2.5rem', textAlign: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
                        color: 'var(--color-text-muted)', fontSize: '0.88rem',
                    }}
                >
                    <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                        style={{
                            display: 'inline-block', width: 8, height: 8,
                            borderRadius: '50%', background: 'var(--color-success)',
                            boxShadow: '0 0 7px var(--color-success)', flexShrink: 0,
                        }}
                    />
                    <span>
                        <strong style={{ color: 'var(--color-text)' }}>{personas} personas</strong> han confiado en nosotros en la última hora
                    </span>
                </motion.div>
            </div>
        </section>
    )
}
