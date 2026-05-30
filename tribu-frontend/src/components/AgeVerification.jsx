import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Check, X } from 'lucide-react'

const AGE_KEY = 'tribu_age_verified'

export default function AgeVerification({ children, feature = 'juego' }) {
    const [verified, setVerified] = useState(false)

    useEffect(() => {
        const stored = sessionStorage.getItem(AGE_KEY)
        if (stored === 'true') {
            setVerified(true)
        }
    }, [])

    const confirmAge = () => {
        sessionStorage.setItem(AGE_KEY, 'true')
        setVerified(true)
    }

    if (verified) return children

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    minHeight: '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    style={{
                        maxWidth: 480,
                        width: '100%',
                        background: 'var(--color-surface)',
                        border: '1px solid rgba(255, 87, 34, 0.2)',
                        borderRadius: '24px',
                        padding: '3rem 2rem',
                        textAlign: 'center'
                    }}
                >
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'rgba(255, 87, 34, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                    }}>
                        <ShieldAlert size={36} color="#FF5722" />
                    </div>

                    <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                        Verificación de edad requerida
                    </h2>

                    <p style={{ color: '#999', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                        Esta sección contiene mecánicas de {feature === 'ruleta' ? 'juego' : 'gamificación'} y solo está permitida
                        para <strong style={{ color: '#fff' }}>mayores de 18 años</strong>. Confirma tu edad para continuar.
                    </p>

                    <div style={{
                        background: 'rgba(255, 183, 77, 0.08)',
                        border: '1px solid rgba(255, 183, 77, 0.15)',
                        borderRadius: '12px',
                        padding: '0.8rem 1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#FFB84D', lineHeight: 1.4 }}>
                            Los puntos y premios obtenidos en esta sección no tienen valor comercial externo,
                            no son convertibles a efectivo y solo pueden usarse dentro de la plataforma.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={confirmAge}
                            style={{
                                flex: 1,
                                padding: '0.9rem',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #FF5722, #FF9800)',
                                color: '#fff',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Check size={18} /> Soy mayor de 18 años
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            style={{
                                flex: 1,
                                padding: '0.9rem',
                                borderRadius: '12px',
                                background: 'transparent',
                                color: '#888',
                                border: '1px solid #333',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <X size={18} /> Volver
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
