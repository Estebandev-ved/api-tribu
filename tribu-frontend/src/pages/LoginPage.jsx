import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login, api } from '../api'
import toast from 'react-hot-toast'
import { Mail, Lock, Shield } from 'lucide-react'

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState('login') // 'login' | '2fa'
    const [codigo2fa, setCodigo2fa] = useState('')
    const [emailFor2fa, setEmailFor2fa] = useState('')
    const { loginUser } = useAuth()
    const navigate = useNavigate()

    const handleGoogleLoginResponse = async (response) => {
        setLoading(true)
        try {
            const { data } = await api.post('/auth/google', { token: response.credential })
            loginUser(data)
            toast.success(`¡Bienvenido, ${data.nombreCompleto.split(' ')[0]}!`)
            navigate(data.rol === 'ADMIN' ? '/admin' : '/')
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || 'Error de autenticación con Google')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (step !== 'login') return

        const initGoogleLogin = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "1005886675200-a2hgpj1aab85l0r4m8m8e4h8h8h8h8h8.apps.googleusercontent.com",
                    callback: handleGoogleLoginResponse
                });
                window.google.accounts.id.renderButton(
                    document.getElementById("googleBtn"),
                    { theme: "dark", size: "large", width: "100%", type: "standard", shape: "rectangular", logo_alignment: "left" }
                );
            }
        };

        if (window.google) {
            initGoogleLogin();
        } else {
            const script = document.createElement('script');
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = initGoogleLogin;
            document.head.appendChild(script);
        }
    }, [step]);

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await login(form)
            if (data.requires2fa) {
                setEmailFor2fa(data.email)
                setStep('2fa')
                toast('🔐 Ingresa el código de tu app autenticadora', { icon: '🛡️' })
            } else {
                loginUser(data)
                toast.success(`¡Bienvenido, ${data.nombreCompleto.split(' ')[0]}!`)
                navigate(data.rol === 'ADMIN' ? '/admin' : '/')
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || 'Email o contraseña incorrectos')
        } finally {
            setLoading(false)
        }
    }

    const handle2faSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await api.post('/auth/verify-2fa', { email: emailFor2fa, codigo: codigo2fa })
            loginUser(data)
            toast.success(`¡Bienvenido, ${data.nombreCompleto.split(' ')[0]}!`)
            navigate(data.rol === 'ADMIN' ? '/admin' : '/')
        } catch (err) {
            toast.error(err.response?.data?.mensaje || 'Código incorrecto. Vuelve a intentarlo.')
            setCodigo2fa('')
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
                            background: step === '2fa'
                                ? 'linear-gradient(135deg, #059669, #10b981)'
                                : 'linear-gradient(135deg, rgba(255,87,34,0.9), rgba(255,122,51,0.9))',
                            marginBottom: '1rem', transition: 'background 0.5s'
                        }}
                    >
                        {step === '2fa' ? (
                            <Shield size={30} color="#fff" />
                        ) : (
                            <img src="/logo-tribu.png" alt="Tribu" style={{ width: 44, height: 44, objectFit: 'contain' }} />
                        )}
                    </motion.div>
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.8rem' }}>
                        {step === '2fa' ? 'Verificación en 2 pasos' : 'Ingresar a Tribu'}
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                        {step === '2fa' ? 'Abre Google Authenticator o Authy' : 'Tu cuenta de productos virales'}
                    </p>
                </div>

                <div className="card" style={{ padding: '2rem' }}>
                    <AnimatePresence mode="wait">
                        {step === 'login' ? (
                            <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label><Mail size={14} style={{ marginRight: 4 }} />Email</label>
                                    <input id="login-email" className="input" type="email" placeholder="tu@email.com"
                                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label><Lock size={14} style={{ marginRight: 4 }} />Contraseña</label>
                                    <input id="login-password" className="input" type="password" placeholder="Tu contraseña"
                                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                                </div>
                                <div style={{ textAlign: 'right', marginBottom: '1rem', marginTop: '-0.5rem' }}>
                                    <Link to="/forgot-password" style={{ color: 'var(--color-primary-light)', fontSize: '0.82rem', fontWeight: 500 }}>
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    type="submit" className="btn btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1rem' }}
                                    disabled={loading}
                                >
                                    {loading ? '⏳ Ingresando...' : 'Ingresar'}
                                </motion.button>

                                <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '0.75rem' }}>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>O continuar con</span>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                                </div>

                                <div style={{ minHeight: '44px', display: 'flex', justifyContent: 'center' }}>
                                    <div id="googleBtn" style={{ width: '100%' }}></div>
                                </div>
                            </motion.form>
                        ) : (
                            <motion.form key="2fa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handle2faSubmit}>
                                <div style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Shield size={20} color="#10b981" />
                                    <p style={{ color: '#10b981', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
                                        Tu cuenta tiene doble verificación activa.<br />
                                        <span style={{ color: '#aaa' }}>Ingresa el código de 6 dígitos de tu app.</span>
                                    </p>
                                </div>
                                <div className="form-group">
                                    <label><Shield size={14} style={{ marginRight: 4 }} />Código de verificación</label>
                                    <input
                                        id="codigo-2fa"
                                        className="input"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={codigo2fa}
                                        onChange={e => setCodigo2fa(e.target.value.replace(/\D/g, ''))}
                                        autoFocus
                                        style={{ fontSize: '2rem', textAlign: 'center', letterSpacing: '0.5rem', fontWeight: 700 }}
                                        required
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    type="submit" className="btn btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1rem', background: 'linear-gradient(135deg, #059669, #10b981)' }}
                                    disabled={loading || codigo2fa.length !== 6}
                                >
                                    {loading ? '⏳ Verificando...' : '✅ Verificar código'}
                                </motion.button>
                                <button type="button" onClick={() => setStep('login')}
                                    style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.85rem', cursor: 'pointer', marginTop: '1rem', display: 'block', width: '100%', textAlign: 'center' }}>
                                    ← Volver al login
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {step === 'login' && (
                        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            ¿No tienes cuenta?{' '}
                            <Link to="/register" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>Regístrate</Link>
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
