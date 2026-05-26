import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { api } from '../api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.post('/auth/forgot-password', { email })
            setSent(true)
        } catch {
            toast.error('Ocurrió un error. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ width: '100%', maxWidth: 420 }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 72, height: 72, borderRadius: '18px',
                            background: 'linear-gradient(135deg, rgba(255,87,34,0.95), rgba(255,122,51,0.95))',
                            marginBottom: '1rem',
                        }}
                    >
                        <img src="/logo-tribu.png" alt="Tribu" style={{ width: 44, height: 44, objectFit: 'contain' }} />
                    </motion.div>
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.8rem' }}>
                        ¿Olvidaste tu contraseña?
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                        Te enviamos un enlace de recuperación
                    </p>
                </div>

                <div className="card" style={{ padding: '2rem' }}>
                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center', padding: '1rem 0' }}
                        >
                            <CheckCircle size={52} color="#22c55e" style={{ marginBottom: '1rem' }} />
                            <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.75rem' }}>
                                ¡Revisa tu correo!
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                Si <strong>{email}</strong> está registrado, recibirás un enlace válido por <strong>15 minutos</strong>.
                            </p>
                            <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '1rem' }}>
                                ¿No llegó? Revisa tu carpeta de spam.
                            </p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label><Mail size={14} style={{ marginRight: 4 }} />Correo electrónico</label>
                                <input
                                    id="forgot-email"
                                    className="input"
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                type="submit" className="btn btn-primary"
                                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem', fontSize: '1rem' }}
                                disabled={loading}
                            >
                                {loading ? '⏳ Enviando...' : 'Enviar enlace de recuperación'}
                            </motion.button>
                        </form>
                    )}
                    <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        <Link to="/login" style={{ color: 'var(--color-primary-light)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <ArrowLeft size={14} /> Volver al login
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
