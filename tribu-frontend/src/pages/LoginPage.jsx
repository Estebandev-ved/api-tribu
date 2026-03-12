import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login } from '../api'
import toast from 'react-hot-toast'
import { Flame, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const { loginUser } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await login(form)
            loginUser(data)
            toast.success(`¡Bienvenido, ${data.nombreCompleto.split(' ')[0]}!`)
            navigate(data.rol === 'ADMIN' ? '/admin' : '/')
        } catch (err) {
            toast.error(err.response?.data?.mensaje || 'Email o contraseña incorrectos')
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
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 64, height: 64, borderRadius: '18px',
                            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                            marginBottom: '1rem',
                        }}
                    >
                        <Flame size={30} color="#fff" />
                    </motion.div>
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.8rem' }}>Ingresar a Tribu</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>Tu cuenta de productos virales</p>
                </div>

                <div className="card" style={{ padding: '2rem' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label><Mail size={14} style={{ marginRight: 4 }} />Email</label>
                            <input className="input" type="email" placeholder="tu@email.com"
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label><Lock size={14} style={{ marginRight: 4 }} />Contraseña</label>
                            <input className="input" type="password" placeholder="Tu contraseña"
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            type="submit" className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem', fontSize: '1rem' }}
                            disabled={loading}
                        >
                            {loading ? '⏳ Ingresando...' : 'Ingresar'}
                        </motion.button>
                    </form>
                    <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>Regístrate</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
