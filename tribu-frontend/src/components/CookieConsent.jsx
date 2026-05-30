import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, Check, Settings, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

const COOKIE_KEY = 'tribu_cookie_consent'

const styles = {
    overlay: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        padding: '1rem',
        pointerEvents: 'none'
    },
    card: {
        maxWidth: '640px',
        margin: '0 auto',
        background: '#1A1A1A',
        border: '1px solid rgba(255, 87, 34, 0.15)',
        borderRadius: '14px',
        padding: '1.5rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255, 87, 34, 0.05)',
        pointerEvents: 'auto',
        position: 'relative',
        overflow: 'hidden'
    },
    glow: {
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(255,87,34,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        borderRadius: '50%'
    },
    iconBox: {
        width: 44, height: 44, borderRadius: '12px',
        background: 'rgba(255, 87, 34, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        border: '1px solid rgba(255, 87, 34, 0.15)'
    },
    title: { color: '#F5F5F5', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.35rem 0', fontFamily: "'Sora', system-ui, sans-serif" },
    text: { color: '#999', fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 1rem 0' },
    link: { color: '#FF5722', textDecoration: 'underline', fontWeight: 600 },
    labelText: { color: '#F5F5F5', fontSize: '0.85rem', fontWeight: 600, fontFamily: "'Sora', system-ui, sans-serif" },
    labelDesc: { color: '#777', fontSize: '0.75rem', margin: 0 },
    btnPrimary: {
        padding: '0.55rem 1.4rem', borderRadius: '9999px',
        background: '#FF5722',
        color: '#fff', border: 'none', fontWeight: 700,
        fontSize: '0.82rem', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        boxShadow: '0 4px 20px rgba(255, 87, 34, 0.35)',
        transition: 'all 0.2s ease',
        fontFamily: "'Sora', system-ui, sans-serif",
        letterSpacing: '0.01em'
    },
    btnGhost: {
        padding: '0.55rem 1.4rem', borderRadius: '9999px',
        background: 'transparent',
        color: '#999', border: '1px solid rgba(255, 255, 255, 0.08)',
        fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        transition: 'all 0.2s ease',
        fontFamily: "'Sora', system-ui, sans-serif"
    },
    checkbox: { accentColor: '#FF5722', width: 16, height: 16, cursor: 'pointer' }
}

export default function CookieConsent() {
    const [visible, setVisible] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [prefs, setPrefs] = useState({
        necessary: true,
        analytics: false,
        marketing: false
    })

    useEffect(() => {
        const stored = localStorage.getItem(COOKIE_KEY)
        if (!stored) {
            setVisible(true)
        }
    }, [])

    const savePreferences = (newPrefs) => {
        const data = {
            ...newPrefs,
            acceptedAt: new Date().toISOString()
        }
        localStorage.setItem(COOKIE_KEY, JSON.stringify(data))
        setPrefs(newPrefs)
        setVisible(false)
        setShowSettings(false)
    }

    const acceptAll = () => {
        savePreferences({ necessary: true, analytics: true, marketing: true })
    }

    const acceptNecessary = () => {
        savePreferences({ necessary: true, analytics: false, marketing: false })
    }

    if (!visible) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                style={styles.overlay}
            >
                <div style={styles.card}>
                    <div style={styles.glow} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', position: 'relative' }}>
                        <div style={styles.iconBox}>
                            <Shield size={22} color="#FF5722" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={styles.title}>
                                Tu privacidad importa
                            </h3>
                            <p style={styles.text}>
                                Usamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y mostrarte contenido personalizado.{' '}
                                <Link to="/politicas" style={styles.link}>
                                    Más información
                                </Link>
                            </p>

                            {showSettings && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    style={{ marginBottom: '1rem' }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={prefs.necessary} disabled style={styles.checkbox} />
                                            <div>
                                                <span style={styles.labelText}>Necesarias</span>
                                                <p style={styles.labelDesc}>Imprescindibles para el funcionamiento de la plataforma</p>
                                            </div>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={prefs.analytics}
                                                onChange={e => setPrefs({ ...prefs, analytics: e.target.checked })}
                                                style={styles.checkbox} />
                                            <div>
                                                <span style={styles.labelText}>Analíticas</span>
                                                <p style={styles.labelDesc}>Para entender cómo usas la plataforma y mejorarla</p>
                                            </div>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={prefs.marketing}
                                                onChange={e => setPrefs({ ...prefs, marketing: e.target.checked })}
                                                style={styles.checkbox} />
                                            <div>
                                                <span style={styles.labelText}>Marketing</span>
                                                <p style={styles.labelDesc}>Para mostrar ofertas y contenido personalizado</p>
                                            </div>
                                        </label>
                                    </div>
                                </motion.div>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {!showSettings ? (
                                    <>
                                        <button onClick={acceptAll}
                                            style={styles.btnPrimary}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#E64A19'; e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(255, 87, 34, 0.4)' }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#FF5722'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 87, 34, 0.35)' }}>
                                            <Check size={14} /> Aceptar todas
                                        </button>
                                        <button onClick={acceptNecessary}
                                            style={styles.btnGhost}
                                            onMouseEnter={e => { e.currentTarget.style.color = '#F5F5F5'; e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.background = 'rgba(255,87,34,0.08)' }}
                                            onMouseLeave={e => { e.currentTarget.style.color = '#999'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.background = 'transparent' }}>
                                            Solo necesarias
                                        </button>
                                        <button onClick={() => setShowSettings(true)}
                                            style={styles.btnGhost}
                                            onMouseEnter={e => { e.currentTarget.style.color = '#F5F5F5'; e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.background = 'rgba(255,87,34,0.08)' }}
                                            onMouseLeave={e => { e.currentTarget.style.color = '#999'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.background = 'transparent' }}>
                                            <Settings size={14} /> Personalizar
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => savePreferences(prefs)}
                                            style={styles.btnPrimary}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#E64A19'; e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(255, 87, 34, 0.4)' }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#FF5722'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 87, 34, 0.35)' }}>
                                            <Check size={14} /> Guardar preferencias
                                        </button>
                                        <button onClick={() => setShowSettings(false)}
                                            style={styles.btnGhost}
                                            onMouseEnter={e => { e.currentTarget.style.color = '#F5F5F5'; e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.background = 'rgba(255,87,34,0.08)' }}
                                            onMouseLeave={e => { e.currentTarget.style.color = '#999'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.background = 'transparent' }}>
                                            <X size={14} /> Cancelar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
