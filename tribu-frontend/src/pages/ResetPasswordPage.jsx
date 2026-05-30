import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../api'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token')

    const [form, setForm] = useState({ nuevaPassword: '', confirmar: '' })
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    useEffect(() => {
        if (!token) navigate('/login')
    }, [token, navigate])

    const fortaleza = (pass) => {
        if (!pass) return { nivel: 0, texto: '', color: '#333' }
        let score = 0
        if (pass.length >= 8) score++
        if (/[A-Z]/.test(pass)) score++
        if (/[0-9]/.test(pass)) score++
        if (/[^A-Za-z0-9]/.test(pass)) score++
        const levels = [
            { nivel: score, texto: score < 2 ? 'Débil' : score < 3 ? 'Regular' : score < 4 ? 'Buena' : 'Fuerte', color: score < 2 ? '#ef4444' : score < 3 ? '#f97316' : score < 4 ? '#eab308' : '#22c55e' }
        ]
        return levels[0]
    }

    const ft = fortaleza(form.nuevaPassword)
    const coinciden = form.nuevaPassword && form.confirmar && form.nuevaPassword === form.confirmar

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.nuevaPassword !== form.confirmar) {
            toast.error('Las contraseñas no coinciden')
            return
        }
        if (form.nuevaPassword.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres')
            return
        }
        setLoading(true)
        try {
            await api.post('/auth/reset-password', { token, nuevaPassword: form.nuevaPassword })
            setDone(true)
            setTimeout(() => navigate('/login'), 3000)
        } catch (err) {
            toast.error(err.response?.data?.mensaje || 'El enlace es inválido o ha expirado. Solicita uno nuevo.')
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
                        <img src="/logo-tribu.svg" alt="Tribu" style={{ width: 44, height: 44, objectFit: 'contain' }} />
                    </motion.div>
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.8rem' }}>
                        Nueva Contraseña
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                        Elige una contraseña segura para tu cuenta
                    </p>
                </div>

                <div className="card" style={{ padding: '2rem' }}>
                    {done ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center', padding: '1rem 0' }}
                        >
                            <CheckCircle size={52} color="#22c55e" style={{ marginBottom: '1rem' }} />
                            <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.75rem' }}>
                                ¡Contraseña actualizada!
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                Redirigiendo al login en 3 segundos...
                            </p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.4rem' }}>
                                    <Lock size={14} /> Nueva contraseña
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="reset-password"
                                        className="input"
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="Mínimo 8 caracteres"
                                        value={form.nuevaPassword}
                                        onChange={e => setForm({ ...form, nuevaPassword: e.target.value })}
                                        required
                                        style={{ paddingRight: '2.5rem' }}
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)}
                                        style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {form.nuevaPassword && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <div style={{ height: 4, borderRadius: 2, background: '#1a1a1a', overflow: 'hidden' }}>
                                            <motion.div animate={{ width: `${ft.nivel * 25}%`, backgroundColor: ft.color }} style={{ height: '100%', borderRadius: 2 }} />
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: ft.color, marginTop: '0.25rem' }}>
                                            Contraseña: {ft.texto}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.4rem' }}>
                                    <Lock size={14} /> Confirmar contraseña
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="reset-password-confirm"
                                        className="input"
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="Repite la contraseña"
                                        value={form.confirmar}
                                        onChange={e => setForm({ ...form, confirmar: e.target.value })}
                                        required
                                        style={{ paddingRight: '2.5rem', borderColor: form.confirmar ? (coinciden ? '#22c55e' : '#ef4444') : '' }}
                                    />
                                    {form.confirmar && (
                                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                                            {coinciden ? <CheckCircle size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                type="submit" className="btn btn-primary"
                                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1rem' }}
                                disabled={loading || !coinciden}
                            >
                                {loading ? '⏳ Guardando...' : '🔐 Establecer nueva contraseña'}
                            </motion.button>
                        </form>
                    )}
                    <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        <Link to="/forgot-password" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>
                            Solicitar nuevo enlace
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
