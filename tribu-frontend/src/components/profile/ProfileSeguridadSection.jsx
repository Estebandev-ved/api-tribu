import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Key, Smartphone, Shield, Eye, EyeOff, Check, X, QrCode, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import profileService from '../../services/profileService'
import toast from 'react-hot-toast'
import { playExoticClick, playExoticChime } from '../../utils/soundEffects'

const calculateStrength = (pass) => {
  let score = 0
  if (pass.length >= 8) score++
  if (/[A-Z]/.test(pass)) score++
  if (/[a-z]/.test(pass)) score++
  if (/[0-9]/.test(pass)) score++
  if (/[^A-Za-z0-9]/.test(pass)) score++
  return score
}

const STRENGTH_LABELS = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte', 'Excelente']
const STRENGTH_COLORS = ['#E24B4A', '#E24B4A', '#EF9F27', '#EF9F27', '#1D9E75', '#1D9E75']

function PasswordInput({ value, onChange, placeholder, showToggle = true }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: 'rgba(30,30,30,0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '0.5rem',
          padding: '0.875rem 1rem',
          paddingRight: showToggle ? '2.5rem' : '1rem',
          color: 'var(--color-text)',
          fontSize: '0.95rem',
          outline: 'none'
        }}
      />
      {showToggle && (
        <button
          type="button"
          onClick={() => { playExoticClick(); setShow(!show) }}
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  )
}

function PasswordStrengthBar({ password }) {
  const strength = calculateStrength(password)
  const percentage = (strength / 5) * 100

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Fortaleza:</span>
        <span style={{ fontSize: '0.8rem', color: STRENGTH_COLORS[strength], fontWeight: 600 }}>
          {STRENGTH_LABELS[strength]}
        </span>
      </div>
      <div style={{ 
        height: 6, 
        background: 'rgba(255,255,255,0.1)', 
        borderRadius: 3, 
        overflow: 'hidden' 
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          style={{ 
            height: '100%', 
            background: STRENGTH_COLORS[strength],
            borderRadius: 3
          }}
        />
      </div>
    </div>
  )
}

export default function ProfileSeguridadSection() {
  const [activeSubsection, setActiveSubsection] = useState('password')
  const [sesiones, setSesiones] = useState([])
  const [pinConfigurado, setPinConfigurado] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPinForm, setShowPinForm] = useState(false)
  const [pinValue, setPinValue] = useState('')
  const [savingPin, setSavingPin] = useState(false)
  const [saving2FA, setSaving2FA] = useState(false)

  // 2FA custom states
  const [qrSetup, setQrSetup] = useState(null)
  const [codigoActivar, setCodigoActivar] = useState('')
  const [showDesactivar, setShowDesactivar] = useState(false)
  const [passwordDesactivar, setPasswordDesactivar] = useState('')

  const [passwordData, setPasswordData] = useState({
    actual: '',
    nueva: '',
    confirmacion: ''
  })

  useEffect(() => {
    Promise.all([
      profileService.getSesiones().catch(() => ({ data: [] })),
      profileService.getPerfil().catch(() => ({ data: {} })),
      profileService.get2faStatus().catch(() => ({ data: { is2faHabilitado: false } }))
    ])
      .then(([resSesiones, resPerfil, res2fa]) => {
        setSesiones(resSesiones.data || [])
        setPinConfigurado(!!resPerfil.data?.tienePin)
        setTwoFactorEnabled(!!res2fa.data?.is2faHabilitado)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSetup2fa = async () => {
    setSaving2FA(true)
    try {
      const res = await profileService.setup2fa()
      setQrSetup(res.data)
    } catch (err) {
      toast.error('Error al generar la configuración de 2FA. Intenta de nuevo.')
    } finally {
      setSaving2FA(false)
    }
  }

  const handleActivar2fa = async (e) => {
    e.preventDefault()
    setSaving2FA(true)
    try {
      await profileService.enable2fa(codigoActivar)
      setTwoFactorEnabled(true)
      setQrSetup(null)
      setCodigoActivar('')
      toast.success('✅ Doble factor activado. Tu cuenta es ahora más segura.')
    } catch (err) {
      toast.error(err.response?.data?.mensaje || err.response?.data?.message || 'Código incorrecto. Intenta de nuevo.')
      setCodigoActivar('')
    } finally {
      setSaving2FA(false)
    }
  }

  const handleDesactivar2fa = async (e) => {
    e.preventDefault()
    setSaving2FA(true)
    try {
      await profileService.disable2fa(passwordDesactivar)
      setTwoFactorEnabled(false)
      setShowDesactivar(false)
      setPasswordDesactivar('')
      toast.success('⚠️ 2FA desactivado correctamente.')
    } catch (err) {
      toast.error(err.response?.data?.mensaje || err.response?.data?.message || 'Contraseña incorrecta.')
    } finally {
      setSaving2FA(false)
    }
  }

  const handleCambiarPassword = async () => {
    if (passwordData.nueva !== passwordData.confirmacion) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (calculateStrength(passwordData.nueva) < 3) {
      toast.error('La contraseña es muy débil')
      return
    }

    try {
      await profileService.cambiarContrasena({
        contrasenaActual: passwordData.actual,
        contrasenaNueva: passwordData.nueva
      })
      toast.success('Contraseña actualizada correctamente')
      setPasswordData({ actual: '', nueva: '', confirmacion: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar la contraseña')
    }
  }

  const handleCerrarSesion = async (id) => {
    try {
      await profileService.cerrarSesion(id)
      setSesiones(prev => prev.filter(s => s.id !== id))
      toast.success('Sesión cerrada')
    } catch (error) {
      toast.error('Error al cerrar la sesión')
    }
  }

  const handleCerrarOtras = async () => {
    try {
      await profileService.cerrarOtrasSesiones()
      setSesiones(prev => [prev.find(s => s.actual) || prev[0]])
      toast.success('Todas las demás sesiones cerradas')
    } catch (error) {
      toast.error('Error al cerrar sesiones')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(20,20,20,0.6)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1rem',
        padding: '2rem'
      }}
    >
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '1.5rem' }}>
        🔒 Seguridad
      </h3>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'password', icon: Lock, label: 'Contraseña' },
          { key: 'pin', icon: Key, label: 'PIN de transferencias' },
          { key: 'sesiones', icon: Smartphone, label: 'Sesiones activas' },
          { key: '2fa', icon: Shield, label: 'Verificación en 2 pasos' }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => { playExoticClick(); setActiveSubsection(item.key) }}
            style={{
              background: activeSubsection === item.key ? 'rgba(255,87,34,0.15)' : 'transparent',
              border: `1px solid ${activeSubsection === item.key ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: activeSubsection === item.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: '0.85rem'
            }}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubsection === 'password' && (
          <motion.div
            key="password"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Contraseña actual
                </label>
                <PasswordInput
                  value={passwordData.actual}
                  onChange={(e) => setPasswordData({ ...passwordData, actual: e.target.value })}
                  placeholder="••••••••••••"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Nueva contraseña
                </label>
                <PasswordInput
                  value={passwordData.nueva}
                  onChange={(e) => setPasswordData({ ...passwordData, nueva: e.target.value })}
                  placeholder="••••••••••••"
                />
                <PasswordStrengthBar password={passwordData.nueva} />
                <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.7rem' }}>
                  <span style={{ color: passwordData.nueva.length >= 8 ? '#00C896' : 'var(--color-text-faint)' }}>
                    {passwordData.nueva.length >= 8 ? '✓' : '✗'} 8+ caracteres
                  </span>
                  <span style={{ color: /[A-Z]/.test(passwordData.nueva) && /[a-z]/.test(passwordData.nueva) ? '#00C896' : 'var(--color-text-faint)' }}>
                    {/[A-Z]/.test(passwordData.nueva) && /[a-z]/.test(passwordData.nueva) ? '✓' : '✗'} Mayúsculas y minúsculas
                  </span>
                  <span style={{ color: /[0-9]/.test(passwordData.nueva) ? '#00C896' : 'var(--color-text-faint)' }}>
                    {/[0-9]/.test(passwordData.nueva) ? '✓' : '✗'} Números
                  </span>
                  <span style={{ color: /[^A-Za-z0-9]/.test(passwordData.nueva) ? '#00C896' : 'var(--color-text-faint)' }}>
                    {/[^A-Za-z0-9]/.test(passwordData.nueva) ? '✓' : '✗'} Caracteres especiales
                  </span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Repetir nueva contraseña
                </label>
                <PasswordInput
                  value={passwordData.confirmacion}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmacion: e.target.value })}
                  placeholder="••••••••••••"
                />
                {passwordData.confirmacion && (
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    fontSize: '0.75rem', 
                    marginTop: '0.5rem',
                    color: passwordData.nueva === passwordData.confirmacion ? '#00C896' : '#ff4d4d'
                  }}>
                    {passwordData.nueva === passwordData.confirmacion ? <><Check size={12} /> Las contraseñas coinciden</> : <><X size={12} /> Las contraseñas no coinciden</>}
                  </span>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCambiarPassword}
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
              >
                Actualizar contraseña
              </motion.button>
            </div>
          </motion.div>
        )}

        {activeSubsection === 'pin' && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div style={{ 
              background: pinConfigurado ? 'rgba(0,200,150,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${pinConfigurado ? '#00C896' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              {pinConfigurado ? (
                <>
                  <div style={{ 
                    background: '#00C896', 
                    borderRadius: '50%', 
                    padding: '0.75rem',
                    display: 'flex'
                  }}>
                    <Check size={24} color="#fff" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--color-text)', margin: '0 0 0.5rem' }}>PIN configurado</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
                      Tu PIN protege las transferencias mayores a $100.000
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
                      Cambiar PIN
                    </button>
                    <button className="btn btn-ghost" style={{ fontSize: '0.85rem', color: '#ff4d4d' }}>
                      Desactivar PIN
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {!showPinForm ? (
                    <>
                      <Key size={32} color="var(--color-text-muted)" />
                      <div style={{ textAlign: 'center' }}>
                        <h4 style={{ color: 'var(--color-text)', margin: '0 0 0.5rem' }}>Configurar PIN de transferencias</h4>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
                          Protege tus transferencias mayores a $100.000 con un PIN de 4 dígitos
                        </p>
                      </div>
                      <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => setShowPinForm(true)}>
                        Configurar PIN →
                      </button>
                    </>
                  ) : (
                    <>
                      <Key size={32} color="var(--color-primary)" />
                      <div style={{ textAlign: 'center' }}>
                        <h4 style={{ color: 'var(--color-text)', margin: '0 0 0.5rem' }}>Ingresa tu nuevo PIN</h4>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                          Escribe 4 dígitos numéricos
                        </p>
                      </div>
                      <input
                        type="password"
                        maxLength={4}
                        value={pinValue}
                        onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="• • • •"
                        style={{
                          width: '150px',
                          textAlign: 'center',
                          fontSize: '1.5rem',
                          letterSpacing: '0.5rem',
                          background: 'rgba(30,30,30,0.8)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          color: 'var(--color-text)',
                          outline: 'none'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: '0.85rem' }}
                          onClick={() => { setShowPinForm(false); setPinValue('') }}
                        >
                          Cancelar
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="btn btn-primary"
                          style={{ fontSize: '0.85rem' }}
                          disabled={pinValue.length !== 4 || savingPin}
                          onClick={async () => {
                            setSavingPin(true)
                            try {
                              await profileService.configurarPin(pinValue)
                              setPinConfigurado(true)
                              setShowPinForm(false)
                              setPinValue('')
                              toast.success('PIN configurado exitosamente')
                            } catch (err) {
                              toast.error(err.response?.data?.message || 'Error al configurar PIN')
                            } finally {
                              setSavingPin(false)
                            }
                          }}
                        >
                          {savingPin ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : 'Guardar PIN'}
                        </motion.button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}

        {activeSubsection === 'sesiones' && (
          <motion.div
            key="sesiones"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sesiones.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  No hay otras sesiones activas
                </p>
              ) : (
                sesiones.map((sesion) => (
                  <div
                    key={sesion.id}
                    style={{
                      background: 'rgba(30,30,30,0.8)',
                      border: `1px solid ${sesion.actual ? '#00C896' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {sesion.actual && (
                          <span style={{ 
                            width: 8, height: 8, borderRadius: '50%', 
                            background: '#00C896' 
                          }} />
                        )}
                        <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                          {sesion.dispositivo || 'Este dispositivo'}
                        </span>
                      </div>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                        {sesion.navegador || 'Chrome'} · {sesion.ciudad || 'Bogotá, Colombia'}
                      </p>
                      <p style={{ color: 'var(--color-text-faint)', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
                        {sesion.actual ? 'Ahora mismo' : `Hace ${sesion.tiempo}`}
                      </p>
                    </div>
                    {!sesion.actual && (
                      <button
                        onClick={() => handleCerrarSesion(sesion.id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #ff4d4d',
                          color: '#ff4d4d',
                          borderRadius: '0.25rem',
                          padding: '0.5rem 0.75rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Cerrar
                      </button>
                    )}
                  </div>
                ))
              )}
              {sesiones.length > 1 && (
                <button
                  onClick={handleCerrarOtras}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ff4d4d',
                    color: '#ff4d4d',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    marginTop: '0.5rem'
                  }}
                >
                  Cerrar todas las otras sesiones
                </button>
              )}
            </div>
          </motion.div>
        )}

        {activeSubsection === '2fa' && (
          <motion.div
            key="2fa"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div style={{ 
              background: 'rgba(30,30,30,0.8)',
              border: `1px solid ${twoFactorEnabled ? 'rgba(0,200,150,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '0.75rem',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Shield size={24} color={twoFactorEnabled ? '#00C896' : 'var(--color-text-muted)'} />
                  <div>
                    <h4 style={{ color: 'var(--color-text)', margin: 0 }}>Verificación en dos pasos (2FA)</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                      Estado: {twoFactorEnabled ? 'Activado' : 'Desactivado'}
                    </p>
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                  background: twoFactorEnabled ? 'rgba(0,200,150,0.15)' : 'rgba(239,68,68,0.15)',
                  color: twoFactorEnabled ? '#00C896' : '#ef4444',
                  border: `1px solid ${twoFactorEnabled ? '#00C896' : '#ef4444'}40`
                }}>
                  {twoFactorEnabled ? '✅ Activo' : '⚠️ Inactivo'}
                </span>
              </div>
              
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                {twoFactorEnabled
                  ? 'Tu cuenta está protegida. Cada vez que inicies sesión, necesitarás un código de tu app autenticadora.'
                  : 'Añade una capa extra de seguridad usando Google Authenticator o Authy. Incluso si alguien obtiene tu contraseña, no podrá acceder sin tu teléfono.'}
              </p>

              {/* Activar 2FA — Paso 1: mostrar botón */}
              {!twoFactorEnabled && !qrSetup && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={saving2FA}
                  onClick={handleSetup2fa}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <QrCode size={18} /> {saving2FA ? 'Generando...' : 'Activar 2FA con App Autenticadora'}
                </motion.button>
              )}

              {/* Activar 2FA — Paso 2: escanear QR y verificar */}
              {!twoFactorEnabled && qrSetup && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ background: '#1a1a28', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                      <strong style={{ color: '#f1f5f9' }}>Paso 1:</strong> Abre Google Authenticator o Authy y escanea este QR:
                    </p>
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                      <img src={qrSetup.qrCode} alt="Código QR para 2FA" style={{ width: 180, height: 180, borderRadius: '12px', background: '#fff', padding: '8px' }} />
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' }}>
                      <p style={{ color: '#888', fontSize: '0.75rem', margin: 0 }}>¿No puedes escanear? Ingresa este código manualmente en tu app:</p>
                      <p style={{ color: 'var(--color-primary)', fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, margin: '0.25rem 0 0 0', wordBreak: 'break-all' }}>{qrSetup.secreto}</p>
                    </div>
                  </div>
                  <form onSubmit={handleActivar2fa} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.4rem' }}>
                        <strong style={{ color: '#f1f5f9' }}>Paso 2:</strong> Ingresa el código de 6 dígitos:
                      </label>
                      <input
                        id="codigo-activar-2fa"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={codigoActivar}
                        onChange={e => setCodigoActivar(e.target.value.replace(/\D/g, ''))}
                        style={{
                          width: '100%',
                          background: 'rgba(30,30,30,0.8)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          color: 'var(--color-text)',
                          fontSize: '1.5rem',
                          textAlign: 'center',
                          letterSpacing: '0.4rem',
                          fontWeight: 700,
                          outline: 'none'
                        }}
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={saving2FA || codigoActivar.length !== 6}
                      style={{ background: 'linear-gradient(135deg, #00C896, #059669)', border: 'none', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', height: '46px' }}
                    >
                      <CheckCircle size={18} /> {saving2FA ? 'Verificando...' : 'Activar'}
                    </motion.button>
                    <button type="button" onClick={() => { setQrSetup(null); setCodigoActivar('') }}
                      style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#888', padding: '0.75rem 1rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', height: '46px' }}>
                      <XCircle size={16} /> Cancelar
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Desactivar 2FA */}
              {twoFactorEnabled && !showDesactivar && (
                <button onClick={() => setShowDesactivar(true)}
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <AlertTriangle size={16} /> Desactivar 2FA
                </button>
              )}

              {twoFactorEnabled && showDesactivar && (
                <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleDesactivar2fa}
                  style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ color: '#ef4444', fontSize: '0.88rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} /> Confirma tu contraseña para desactivar el 2FA:
                  </p>
                  <input
                    id="password-desactivar-2fa"
                    type="password"
                    placeholder="Tu contraseña actual"
                    value={passwordDesactivar}
                    onChange={e => setPasswordDesactivar(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(30,30,30,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      color: 'var(--color-text)',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="submit" disabled={saving2FA || !passwordDesactivar}
                      style={{ background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}>
                      {saving2FA ? 'Procesando...' : 'Confirmar desactivación'}
                    </button>
                    <button type="button" onClick={() => { setShowDesactivar(false); setPasswordDesactivar('') }}
                      style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#888', padding: '0.65rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                      Cancelar
                    </button>
                  </div>
                </motion.form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}