import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, MapPin, Mail, Save, LogOut, Package, ShoppingBag, Gift, Shield, QrCode, Lock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMiPerfil, updateMiPerfil, getMisPedidos, api } from '../api'
import PedidoCard from '../components/PedidoCard'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function MiPerfilPage() {
    const { logout, updateUser } = useAuth()
    const navigate = useNavigate()
    const [perfil, setPerfil] = useState({ nombreCompleto: '', email: '', telefono: '', direccion: '' })
    const [pedidos, setPedidos] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('datos')

    // Estado seguridad
    const [is2faOn, setIs2faOn] = useState(false)
    const [qrSetup, setQrSetup] = useState(null) // { qrCode, secreto }
    const [codigoActivar, setCodigoActivar] = useState('')
    const [passwordDesactivar, setPasswordDesactivar] = useState('')
    const [loadingSec, setLoadingSec] = useState(false)
    const [showDesactivar, setShowDesactivar] = useState(false)

    const canSpinToday = () => {
        if (!perfil.fechaUltimoGiroRuleta) return true
        const lastSpin = new Date(perfil.fechaUltimoGiroRuleta)
        const today = new Date()
        return lastSpin.toDateString() !== today.toDateString()
    }

    useEffect(() => {
        Promise.all([
            getMiPerfil(),
            getMisPedidos().catch(() => ({ data: [] })),
            api.get('/usuarios/perfil/2fa/status').catch(() => ({ data: { is2faHabilitado: false } }))
        ])
            .then(([resPerfil, resPedidos, res2fa]) => {
                setPerfil(resPerfil.data)
                setPedidos(resPedidos.data)
                setIs2faOn(res2fa.data.is2faHabilitado)
                updateUser({ tribuPassActiva: resPerfil.data.tribuPassActiva })
            })
            .catch(() => toast.error('Error al cargar la información del perfil'))
            .finally(() => setLoading(false))
    }, [])

    const handleChange = e => setPerfil({ ...perfil, [e.target.name]: e.target.value })

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await updateMiPerfil({ nombreCompleto: perfil.nombreCompleto, telefono: perfil.telefono, direccion: perfil.direccion })
            setPerfil({ ...perfil, ...res.data })
            toast.success('Perfil actualizado correctamente')
        } catch {
            toast.error('Ocurrió un error al actualizar los datos')
        } finally {
            setSaving(false)
        }
    }

    const handleSetup2fa = async () => {
        setLoadingSec(true)
        try {
            const { data } = await api.post('/usuarios/perfil/2fa/setup')
            setQrSetup(data)
            toast('Escanea el código QR con Google Authenticator o Authy', { icon: '📱' })
        } catch {
            toast.error('Error al generar el QR. Intenta de nuevo.')
        } finally {
            setLoadingSec(false)
        }
    }

    const handleActivar2fa = async (e) => {
        e.preventDefault()
        setLoadingSec(true)
        try {
            await api.post('/usuarios/perfil/2fa/enable', { codigo: codigoActivar })
            setIs2faOn(true)
            setQrSetup(null)
            setCodigoActivar('')
            toast.success('✅ Doble factor activado. Tu cuenta es ahora más segura.')
        } catch (err) {
            toast.error(err.response?.data?.mensaje || 'Código incorrecto. Intenta de nuevo.')
            setCodigoActivar('')
        } finally {
            setLoadingSec(false)
        }
    }

    const handleDesactivar2fa = async (e) => {
        e.preventDefault()
        setLoadingSec(true)
        try {
            await api.post('/usuarios/perfil/2fa/disable', { password: passwordDesactivar })
            setIs2faOn(false)
            setShowDesactivar(false)
            setPasswordDesactivar('')
            toast.success('2FA desactivado correctamente.')
        } catch (err) {
            toast.error(err.response?.data?.mensaje || 'Contraseña incorrecta.')
        } finally {
            setLoadingSec(false)
        }
    }

    if (loading) return <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}><div className="spinner" /></div>

    const tabs = [
        { id: 'datos', label: 'Datos Personales', icon: <User size={18} /> },
        { id: 'pedidos', label: 'Mis Pedidos', icon: <Package size={18} />, count: pedidos.length },
        { id: 'seguridad', label: 'Seguridad', icon: <Shield size={18} /> },
    ]

    return (
        <div className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem', minHeight: '80vh' }}>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 800, margin: '0 auto' }}>

                {/* Cabecera */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255,87,34,0.15)', padding: '1rem', borderRadius: '50%', color: 'var(--color-primary)' }}>
                            <User size={32} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>¡Hola, {perfil.nombreCompleto.split(' ')[0]}!</h1>
                            <p style={{ color: 'var(--color-text-faint)', fontSize: '0.9rem', margin: 0 }}>Gestiona tu cuenta y sigue tus compras.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {canSpinToday() && (
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/billetera')}
                                style={{ background: 'linear-gradient(45deg, #FF5722, #FF9800)', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,87,34,0.4)', fontSize: '0.85rem' }}>
                                <Gift size={16} /> ¡Giro Gratis!
                            </motion.button>
                        )}
                        <button onClick={() => { logout(); navigate('/') }} className="btn btn-ghost" style={{ fontSize: '0.85rem', color: '#ff4d4d' }}>
                            <LogOut size={16} /> Cerrar Sesión
                        </button>
                    </div>
                </div>

                {/* Pestañas */}
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer',
                                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '1rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                            }}>
                            {tab.icon} {tab.label}
                            {tab.count > 0 && <span style={{ background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{tab.count}</span>}
                        </button>
                    ))}
                </div>

                {/* Contenido */}
                <AnimatePresence mode="wait">
                    {activeTab === 'datos' && (
                        <motion.div key="datos" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                            <div style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '1rem', padding: '2rem' }}>
                                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                            <Mail size={14} /> Correo Electrónico (No modificable)
                                        </label>
                                        <input className="input" type="email" value={perfil.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                            <User size={14} /> Nombre Completo
                                        </label>
                                        <input className="input" type="text" name="nombreCompleto" value={perfil.nombreCompleto} onChange={handleChange} required placeholder="¿Cómo te llamas?" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                            <Phone size={14} /> Teléfono
                                        </label>
                                        <input className="input" type="text" name="telefono" value={perfil.telefono} onChange={handleChange} placeholder="Tu número de contacto" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                            <MapPin size={14} /> Dirección de Envío Principal
                                        </label>
                                        <textarea className="input" name="direccion" value={perfil.direccion} onChange={handleChange} rows={3} placeholder="Calle, número, apto, barrio, ciudad..." style={{ resize: 'vertical' }} />
                                    </div>
                                    <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.8rem', justifyContent: 'center' }}>
                                        {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><Save size={18} /> Guardar Cambios</>}
                                    </motion.button>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'pedidos' && (
                        <motion.div key="pedidos" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                            {pedidos.length === 0 ? (
                                <div className="empty-state" style={{ padding: '4rem 1rem' }}>
                                    <ShoppingBag size={48} />
                                    <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Aún no tienes compras en Tribu</p>
                                    <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/virales')}>Ver Lo Más Viral</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {pedidos.map((p, i) => <PedidoCard key={p.id} pedido={p} index={i} />)}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'seguridad' && (
                        <motion.div key="seguridad" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                {/* Contraseña */}
                                <div style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '1rem', padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <Lock size={20} color="var(--color-primary)" />
                                        <h3 style={{ margin: 0, fontWeight: 700 }}>Cambiar Contraseña</h3>
                                    </div>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                        Si olvidaste tu contraseña actual, usa el flujo de recuperación por correo.
                                    </p>
                                    <button className="btn btn-ghost" onClick={() => navigate('/forgot-password')}
                                        style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem 1.2rem' }}>
                                        📧 Enviar enlace de recuperación a mi correo
                                    </button>
                                </div>

                                {/* 2FA */}
                                <div style={{ background: 'var(--color-card-bg)', border: `1px solid ${is2faOn ? 'rgba(34,197,94,0.3)' : 'var(--color-card-border)'}`, borderRadius: '1rem', padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Shield size={20} color={is2faOn ? '#22c55e' : 'var(--color-primary)'} />
                                            <h3 style={{ margin: 0, fontWeight: 700 }}>Autenticación de Dos Factores (2FA)</h3>
                                        </div>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                                            background: is2faOn ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                            color: is2faOn ? '#22c55e' : '#ef4444',
                                            border: `1px solid ${is2faOn ? '#22c55e' : '#ef4444'}40`
                                        }}>
                                            {is2faOn ? '✅ Activo' : '⚠️ Inactivo'}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                                        {is2faOn
                                            ? 'Tu cuenta está protegida. Cada vez que inicies sesión, necesitarás un código de tu app autenticadora.'
                                            : 'Añade una capa extra de seguridad usando Google Authenticator o Authy. Incluso si alguien obtiene tu contraseña, no podrá acceder sin tu teléfono.'}
                                    </p>

                                    {/* Activar 2FA — Paso 1: mostrar QR */}
                                    {!is2faOn && !qrSetup && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            onClick={handleSetup2fa}
                                            disabled={loadingSec}
                                            style={{ background: 'linear-gradient(135deg, #7c3aed, #9f67ff)', border: 'none', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                                            <QrCode size={18} /> {loadingSec ? 'Generando...' : 'Activar 2FA con App Autenticadora'}
                                        </motion.button>
                                    )}

                                    {/* Activar 2FA — Paso 2: escanear QR y verificar */}
                                    {!is2faOn && qrSetup && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                            <div style={{ background: 'var(--color-card-bg-soft)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.25rem', border: '1px solid var(--color-card-border)' }}>
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                                                    <strong style={{ color: 'var(--color-text)' }}>Paso 1:</strong> Abre Google Authenticator o Authy y escanea este QR:
                                                </p>
                                                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                                    <img src={qrSetup.qrCode} alt="Código QR para 2FA" style={{ width: 180, height: 180, borderRadius: '12px', background: '#fff', padding: '8px' }} />
                                                </div>
                                                <div style={{ background: 'var(--color-card-bg-soft)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem', border: '1px solid var(--color-card-border)' }}>
                                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: 0 }}>¿No puedes escanear? Ingresa este código manualmente en tu app:</p>
                                                    <p style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, margin: '0.25rem 0 0 0', wordBreak: 'break-all' }}>{qrSetup.secreto}</p>
                                                </div>
                                            </div>
                                            <form onSubmit={handleActivar2fa} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                                <div style={{ flex: 1, minWidth: 160 }}>
                                                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                                        <strong style={{ color: 'var(--color-text)' }}>Paso 2:</strong> Ingresa el código de 6 dígitos:
                                                    </label>
                                                    <input
                                                        id="codigo-activar-2fa"
                                                        className="input"
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={6}
                                                        placeholder="000000"
                                                        value={codigoActivar}
                                                        onChange={e => setCodigoActivar(e.target.value.replace(/\D/g, ''))}
                                                        style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.4rem', fontWeight: 700 }}
                                                    />
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                    type="submit"
                                                    disabled={loadingSec || codigoActivar.length !== 6}
                                                    style={{ background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <CheckCircle size={18} /> {loadingSec ? 'Verificando...' : 'Activar'}
                                                </motion.button>
                                                <button type="button" onClick={() => { setQrSetup(null); setCodigoActivar('') }}
                                                    style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '0.75rem 1rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <XCircle size={16} /> Cancelar
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}

                                    {/* Desactivar 2FA */}
                                    {is2faOn && !showDesactivar && (
                                        <button onClick={() => setShowDesactivar(true)}
                                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                            <AlertTriangle size={16} /> Desactivar 2FA
                                        </button>
                                    )}

                                    {is2faOn && showDesactivar && (
                                        <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleDesactivar2fa}
                                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <p style={{ color: '#ef4444', fontSize: '0.88rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <AlertTriangle size={16} /> Confirma tu contraseña para desactivar el 2FA:
                                            </p>
                                            <input
                                                id="password-desactivar-2fa"
                                                className="input"
                                                type="password"
                                                placeholder="Tu contraseña actual"
                                                value={passwordDesactivar}
                                                onChange={e => setPasswordDesactivar(e.target.value)}
                                                required
                                            />
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <button type="submit" disabled={loadingSec || !passwordDesactivar}
                                                    style={{ background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}>
                                                    {loadingSec ? 'Procesando...' : 'Confirmar desactivación'}
                                                </button>
                                                <button type="button" onClick={() => { setShowDesactivar(false); setPasswordDesactivar('') }}
                                                    style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '0.65rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                                                    Cancelar
                                                </button>
                                            </div>
                                        </motion.form>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        </div>
    )
}
