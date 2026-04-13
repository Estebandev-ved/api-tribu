import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, Send, ArrowLeft, Check, Loader2, Copy, CheckCircle } from 'lucide-react'
import { transferenciaService } from '../services/services'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { formatCOP } from '../utils/formatters'
import { getTierColor, getTierFromOrden } from '../utils/tierColors'
import TierBadge from '../components/TierBadge'
import toast from 'react-hot-toast'

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000]

export default function TransferirPage() {
  const { user } = useAuth()
  const { saldoRealtime } = useNotification()
  const [step, setStep] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [destinatario, setDestinatario] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [monto, setMonto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [limite, setLimite] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [pin, setPin] = useState('')
  const [showPinInput, setShowPinInput] = useState(false)
  const [transferExito, setTransferExito] = useState(false)

  useEffect(() => {
    if (step >= 2) {
      transferenciaService.limiteDisponible()
        .then(res => setLimite(res.data))
        .catch(() => {})
    }
  }, [step])

  useEffect(() => {
    if (!busqueda || busqueda.length < 3) {
      setDestinatario(null)
      setNoEncontrado(false)
      return
    }

    const timeout = setTimeout(async () => {
      setBuscando(true)
      setNoEncontrado(false)
      try {
        const res = await transferenciaService.validarDestinatario(busqueda)
        setDestinatario(res.data)
      } catch (err) {
        setDestinatario(null)
        setNoEncontrado(true)
      } finally {
        setBuscando(false)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [busqueda])

  const handleMontoSelect = (value) => {
    setMonto(prev => {
      const num = parseInt(prev) || 0
      return (num + value).toString()
    })
  }

  const handleDigit = (d) => {
    if (monto.length < 10) setMonto(prev => prev + d)
  }

  const handleBackspace = () => {
    setMonto(prev => prev.slice(0, -1))
  }

  const handleConfirm = async () => {
    if (!destinatario || !monto || parseInt(monto) <= 0) return

    if (parseInt(monto) > 100000) {
      setShowPinInput(true)
      return
    }

    await realizarTransferencia()
  }

  const realizarTransferencia = async (pinConfirm = null) => {
    setEnviando(true)
    try {
      await transferenciaService.enviar(destinatario.email, parseInt(monto), mensaje)
      setTransferExito(true)
      toast.success(`✓ ${formatCOP(monto)} enviados a ${destinatario.nombre}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al realizar transferencia')
    } finally {
      setEnviando(false)
    }
  }

  const handlePinSubmit = () => {
    const storedPin = localStorage.getItem('tribu_pin')
    if (storedPin && storedPin !== btoa(pin)) {
      toast.error('PIN incorrecto')
      return
    }
    setShowPinInput(false)
    realizarTransferencia(pin)
  }

  const tierColor = getTierColor(getTierFromOrden(user?.nivelVip || 1))

  if (transferExito) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          minHeight: '100vh',
          background: 'var(--color-background, #0a0a0a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}
      >
        <div style={{
          textAlign: 'center',
          background: 'var(--color-background-primary, #1a1a1a)',
          borderRadius: 24,
          padding: '3rem 2rem',
          border: '1px solid #1D9E7540'
        }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <CheckCircle size={64} color="#1D9E75" />
          </motion.div>
          <h2 style={{ color: '#fff', marginTop: '1.5rem', fontSize: '1.5rem' }}>
            ¡Transferencia exitosa!
          </h2>
          <p style={{ color: '#888', marginTop: '0.5rem' }}>
            {formatCOP(monto)} enviados a {destinatario?.nombre}
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setTransferExito(false)
              setStep(1)
              setBusqueda('')
              setDestinatario(null)
              setMonto('')
              setMensaje('')
            }}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 2rem',
              background: tierColor.primary,
              color: '#000',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Nueva transferencia
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background, #0a0a0a)',
      paddingTop: '5rem',
      paddingBottom: '2rem'
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 1rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Transferir
          </h1>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: s <= step ? tierColor.primary : '#333'
              }} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div style={{
                background: 'var(--color-background-primary, #1a1a1a)',
                borderRadius: 16,
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1rem' }}>
                  ¿A quién quieres enviar?
                </h3>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ 
                    position: 'absolute', 
                    left: 12, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#666'
                  }} />
                  <input
                    type="text"
                    placeholder="Email o código TRIBU-XXXXX"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem 0.875rem 2.75rem',
                      background: 'var(--color-background-secondary, #2a2a2a)',
                      border: '1px solid var(--color-border-tertiary, #333)',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {buscando && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: '#888' }}>
                    <Loader2 size={16} className="animate-spin" />
                    Buscando...
                  </div>
                )}

                {noEncontrado && (
                  <div style={{ 
                    marginTop: 12, 
                    padding: 12, 
                    background: '#E24B4A20', 
                    borderRadius: 8,
                    color: '#E24B4A',
                    fontSize: '0.9rem'
                  }}>
                    Usuario no encontrado
                  </div>
                )}

                {destinatario && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: 16,
                      padding: 16,
                      background: 'var(--color-background-secondary, #2a2a2a)',
                      borderRadius: 12,
                      border: `1px solid ${tierColor.primary}40`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                    <div style={{
                      width: 48, height: 48,
                      borderRadius: '50%',
                      background: tierColor.primary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#000', fontWeight: 700
                    }}>
                      {destinatario.nombre?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Check size={16} color={tierColor.primary} />
                        <span style={{ color: '#fff', fontWeight: 600 }}>{destinatario.nombre}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <TierBadge tier={getTierFromOrden(destinatario.nivelVip || 1)} size="sm" />
                        {destinatario.ciudad && (
                          <span style={{ fontSize: '0.8rem', color: '#888' }}>📍 {destinatario.ciudad}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: destinatario ? 1.02 : 1 }}
                whileTap={{ scale: destinatario ? 0.98 : 1 }}
                disabled={!destinatario}
                onClick={() => setStep(2)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: destinatario ? tierColor.primary : '#333',
                  color: destinatario ? '#000' : '#666',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: destinatario ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                Continuar
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div style={{
                background: 'var(--color-background-primary, #1a1a1a)',
                borderRadius: 16,
                padding: '1.25rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>Disponible</p>
                <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>
                  {formatCOP(saldoRealtime || 0)}
                </p>
                {limite && (
                  <p style={{ color: '#666', fontSize: '0.8rem', marginTop: 4 }}>
                    Límite hoy: {formatCOP(limite.restante)} disponibles
                  </p>
                )}
              </div>

              <div style={{
                background: 'var(--color-background-primary, #1a1a1a)',
                borderRadius: 16,
                padding: '1.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: '2.5rem', 
                  fontWeight: 700, 
                  color: '#fff',
                  marginBottom: '1.5rem',
                  fontFamily: 'monospace'
                }}>
                  ${parseInt(monto || 0).toLocaleString('es-CO')}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(d => (
                    <motion.button
                      key={d}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (d === '⌫') handleBackspace()
                        else if (d !== '') handleDigit(d)
                      }}
                      disabled={!d}
                      style={{
                        padding: '1rem',
                        background: d === '' ? 'transparent' : 'var(--color-background-secondary, #2a2a2a)',
                        border: 'none',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        cursor: d ? 'pointer' : 'default'
                      }}
                    >
                      {d === '⌫' ? '←' : d}
                    </motion.button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {QUICK_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setMonto(amt.toString())}
                      style={{
                        flex: 1,
                        minWidth: 80,
                        padding: '0.5rem',
                        background: 'var(--color-background-secondary, #2a2a2a)',
                        border: '1px solid var(--color-border-tertiary, #333)',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {formatCOP(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                placeholder="Mensaje opcional (ej. Para el almuerzo)"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'var(--color-background-primary, #1a1a1a)',
                  border: '1px solid var(--color-border-tertiary, #333)',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: '0.9rem',
                  marginBottom: '1rem',
                  outline: 'none'
                }}
              />

              <motion.button
                whileHover={{ scale: monto ? 1.02 : 1 }}
                whileTap={{ scale: monto ? 0.98 : 1 }}
                disabled={!monto || parseInt(monto) <= 0}
                onClick={() => setStep(3)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: monto ? tierColor.primary : '#333',
                  color: monto ? '#000' : '#666',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: monto ? 'pointer' : 'not-allowed'
                }}
              >
                Continuar
              </motion.button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div style={{
                background: 'var(--color-background-primary, #1a1a1a)',
                borderRadius: 16,
                padding: '2rem',
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}>
                <Send size={32} color={tierColor.primary} style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  Confirmar envío
                </h3>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>
                  Enviarás <span style={{ color: '#fff', fontWeight: 700 }}>{formatCOP(monto)}</span> a
                </p>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem', marginTop: 8 }}>
                  {destinatario?.nombre}
                </p>
                {mensaje && (
                  <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 12, fontStyle: 'italic' }}>
                    "{mensaje}"
                  </p>
                )}
              </div>

              {showPinInput && (
                <div style={{
                  background: 'var(--color-background-primary, #1a1a1a)',
                  borderRadius: 16,
                  padding: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  <p style={{ color: '#fff', fontSize: '0.9rem', marginBottom: 12, textAlign: 'center' }}>
                    Ingresa tu PIN de seguridad
                  </p>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: 'var(--color-background-secondary, #2a2a2a)',
                      border: '1px solid var(--color-border-tertiary, #333)',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: '1.5rem',
                      textAlign: 'center',
                      letterSpacing: 16,
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={enviando || (parseInt(monto) > 100000 && pin.length !== 4)}
                onClick={showPinInput ? handlePinSubmit : handleConfirm}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: tierColor.primary,
                  color: '#000',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {enviando ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Confirmar envío
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
