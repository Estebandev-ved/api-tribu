/**
 * Hero.jsx — Parallax inmersivo sobre image_3.png
 *
 * Técnica:
 *  - useScroll + useTransform: calcula el progreso vertical del hero
 *  - useSpring: suaviza el movimiento con damping/stiffness (easing natural)
 *  - isMobile: detecta viewport <768px → desactiva parallax para rendimiento
 *  - backgroundPosition: top center → ancla la imagen en la parte superior central
 *  - Micro-interacción: botón CTA con scale + glow en hover mediante motion.a
 */
import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { Flame, TrendingUp, ShieldCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
    { icon: <Flame size={22} />, title: 'Productos Virales', desc: 'Curados directamente de TikTok y las tendencias globales.' },
    { icon: <Truck size={22} />, title: 'Envío a Todo Colombia', desc: 'Desde Mocoa, Putumayo. Rastreo en tiempo real.' },
    { icon: <TrendingUp size={22} />, title: 'Precios Imbatibles', desc: 'Acceso directo a proveedores. Sin intermediarios.' },
    { icon: <ShieldCheck size={22} />, title: 'Compra 100% Segura', desc: 'Tu pedido protegido desde el pago hasta la entrega.' },
]

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } }
}
const itemVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

// Hook: detecta si es móvil (≤768px) para desactivar parallax
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])
    return isMobile
}

export default function Hero() {
    const ref = useRef(null)
    const isMobile = useIsMobile()

    // Scroll progress del hero (0 = inicio, 1 = el hero sale del viewport)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end start'],
    })

    // Parallax al 20%: si el contenido baja 500px, la imagen sube 100px
    // En móvil → siempre 0 (sin efecto)
    const rawBgY = useTransform(
        scrollYProgress,
        [0, 1],
        isMobile ? ['0%', '0%'] : ['0%', '20%']
    )

    // useSpring: suaviza el movimiento (damping=25 = sin rebote, stiffness=120 = respuesta media)
    const bgY = useSpring(rawBgY, {
        stiffness: 120,
        damping: 25,
        restDelta: 0.001,
    })

    return (
        <>
            {/* ─── HERO ─────────────────────────────────────────────────────────── */}
            <section
                ref={ref}
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '95vh',
                    display: 'flex',
                    alignItems: 'center',
                    textAlign: 'center',
                }}
            >
                {/* ── IMAGEN DE FONDO CON PARALLAX ─────────────────────────────── */}
                <motion.div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        // Extensión extra para que el movimiento parallax
                        // no deje bordes blancos en la parte inferior
                        bottom: isMobile ? 0 : '-25%',
                        y: bgY,
                        // Ancla top-center: las manos abriendo la caja siempre visibles
                        backgroundImage: 'url(/image_3.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'top center',
                        backgroundRepeat: 'no-repeat',
                        // En móvil sin parallax — imagen fija para rendimiento
                        ...(isMobile ? { backgroundAttachment: 'scroll' } : {}),
                    }}
                />

                {/* ── OVERLAY GRADIENTE: legibilidad del texto ─────────────────── */}
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `
                            linear-gradient(
                                to bottom,
                                rgba(17,17,17,0.72) 0%,
                                rgba(17,17,17,0.38) 38%,
                                rgba(17,17,17,0.55) 70%,
                                rgba(17,17,17,0.88) 100%
                            )
                        `,
                    }}
                />

                {/* ── GLOW NARANJA AMBIENTAL ───────────────────────────────────── */}
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        top: '35%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 600, height: 600,
                        background: 'radial-gradient(circle, rgba(255,87,34,0.13) 0%, transparent 65%)',
                        pointerEvents: 'none',
                    }}
                />

                {/* ── CONTENIDO ────────────────────────────────────────────────── */}
                <div className="container" style={{ position: 'relative', paddingTop: '6rem', paddingBottom: '5rem' }}>

                    {/* Chip de comunidad */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(255,87,34,0.12)', border: '1px solid rgba(255,87,34,0.3)',
                            borderRadius: '9999px', padding: '0.35rem 1.1rem',
                            fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)',
                            marginBottom: '1.5rem', letterSpacing: '0.02em',
                        }}
                    >
                        <Flame size={13} /> Únete a los +10,000 que ya lo tienen
                    </motion.div>

                    {/* Título */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.1 }}
                        style={{
                            fontFamily: 'Outfit, sans-serif', fontWeight: 900, lineHeight: 1.08,
                            fontSize: 'clamp(2.5rem, 7vw, 5.2rem)', marginBottom: '1.5rem',
                        }}
                    >
                        Lo más <span className="gradient-text">viral</span><br />
                        llega a tu puerta
                    </motion.h1>

                    {/* Subtítulo */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        style={{
                            color: 'var(--color-text-muted)', fontSize: '1.1rem',
                            maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.65,
                        }}
                    >
                        Los gadgets que arrasan en TikTok hoy.<br />
                        <strong style={{ color: 'var(--color-text)' }}>
                            Pocas unidades. No esperes a verlo en el perfil de alguien más.
                        </strong>
                    </motion.p>

                    {/* CTAs con micro-interacción */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="hero-cta-group"
                        style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
                    >
                        {/* CTA Principal — micro-interacción: scale + glow pulsante */}
                        <motion.div
                            whileHover={{ scale: 1.07 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                            style={{ position: 'relative' }}
                        >
                            {/* Halo pulsante detrás del botón */}
                            <motion.div
                                animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.1, 0.35] }}
                                transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                                style={{
                                    position: 'absolute', inset: -6, borderRadius: '14px',
                                    background: 'var(--color-primary)', filter: 'blur(14px)',
                                    zIndex: 0, pointerEvents: 'none',
                                }}
                            />
                            <Link
                                to="/virales"
                                className="btn btn-primary"
                                style={{
                                    position: 'relative', zIndex: 1,
                                    fontSize: '1rem', padding: '0.9rem 2.4rem', fontWeight: 800,
                                    letterSpacing: '0.01em',
                                }}
                            >
                                <Flame size={17} /> Ver Virales Ahora
                            </Link>
                        </motion.div>

                        {/* CTA Secundario */}
                        <motion.div
                            whileHover={{ scale: 1.04, opacity: 0.9 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                        >
                            <Link to="/" className="btn btn-ghost"
                                style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
                                Explorar catálogo
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Stats de validación social */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.65 }}
                        style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginTop: '3.5rem', flexWrap: 'wrap' }}
                    >
                        {[
                            { num: '+10K', label: 'Clientes felices' },
                            { num: '+500', label: 'Productos virales' },
                            { num: '25', label: 'Ciudades de Colombia' },
                        ].map(s => (
                            <motion.div
                                key={s.label}
                                whileHover={{ y: -3 }}
                                style={{ textAlign: 'center', cursor: 'default' }}
                            >
                                <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.9rem', color: 'var(--color-primary)' }}>{s.num}</p>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{s.label}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Indicador de scroll — solo desktop */}
                    {!isMobile && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                            style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Scroll</span>
                            <motion.div
                                animate={{ y: [0, 7, 0] }}
                                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                                style={{
                                    width: 2, height: 30,
                                    background: 'linear-gradient(to bottom, var(--color-primary), transparent)',
                                    borderRadius: 2,
                                }}
                            />
                        </motion.div>
                    )}
                </div>
            </section>

            {/* ─── FEATURES ─────────────────────────────────────────────────────── */}
            <section style={{ paddingBottom: '4rem' }}>
                <div className="container">
                    <motion.div
                        variants={containerVariants} initial="hidden"
                        whileInView="visible" viewport={{ once: true, amount: 0.25 }}
                        className="features-grid"
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}
                    >
                        {features.map((f) => (
                            <motion.div key={f.title} variants={itemVariants} className="card"
                                whileHover={{ y: -4, borderColor: 'rgba(255,87,34,0.25)' }}
                                style={{ textAlign: 'center' }}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: 50, height: 50, borderRadius: 12,
                                    background: 'rgba(255,87,34,0.12)', color: 'var(--color-primary)', marginBottom: '0.9rem',
                                }}>
                                    {f.icon}
                                </div>
                                <h3 style={{ fontWeight: 700, marginBottom: '0.45rem', fontSize: '0.97rem' }}>{f.title}</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.87rem' }}>{f.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>
        </>
    )
}
