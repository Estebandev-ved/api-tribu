import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, Send, ArrowLeft, Check, Loader2, Copy, CheckCircle, Shield, Lock, Wallet } from 'lucide-react'
import { transferenciaService, pinService } from '../services/services'
import profileService from '../services/profileService'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { formatPts } from '../utils/formatters'
import { getTierColor, getTierFromOrden } from '../utils/tierColors'
import TierBadge from '../components/TierBadge'
import toast from 'react-hot-toast'
import { dbOfflineQueue } from '../services/dbOfflineQueue'
import { verificarQrCobro, transferirPorQr } from '../api'

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000]

export default function TransferirPage() {
  const { user } = useAuth()
  const { saldoRealtime } = useNotification()
  const [saldoBase, setSaldoBase] = useState(null)
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
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [pinSetup, setPinSetup] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [transferResult, setTransferResult] = useState(null)

  // QR P2P Cobro States
  const [mostrarModalQr, setMostrarModalQr] = useState(false)
  const [payloadQrStr, setPayloadQrStr] = useState('')
  const [qrVerificado, setQrVerificado] = useState(null)
  const [verificandoQr, setVerificandoQr] = useState(false)
  const [pagandoQr, setPagandoQr] = useState(false)

  const saldo = saldoRealtime !== null ? saldoRealtime : (saldoBase !== null ? saldoBase : 0)

  useEffect(() => {
    profileService.getPerfil()
      .then(res => setSaldoBase(res.data.saldoFavor || 0))
      .catch(() => setSaldoBase(0))
  }, [])

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

  const handleMontoAdd = (value) => {
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

  const validateMonto = () => {
    const val = parseInt(monto)
    if (!val || val <= 0) return { ok: false, msg: 'Ingresa un monto valido' }
    if (limite && val < limite.minimoPorTransferencia) {
      return { ok: false, msg: `El monto minimo es ${formatPts(limite.minimoPorTransferencia)}` }
    }
    if (limite && val > limite.maximoPorTransferencia) {
      return { ok: false, msg: `El monto maximo para tu nivel es ${formatPts(limite.maximoPorTransferencia)}` }
    }
    if (val > saldo) {
      return { ok: false, msg: `Saldo insuficiente. Tienes ${formatPts(saldo)}` }
    }
    return { ok: true }
  }

  const handleTransferConfirm = async () => {
    const validation = validateMonto()
    if (!validation.ok) {
      toast.error(validation.msg)
      return
    }

    setEnviando(true)
    const dest = destinatario.codigoReferido || busqueda

    if (!navigator.onLine) {
      try {
        await dbOfflineQueue.addTransfer(dest, parseInt(monto), mensaje, pin)
        setTransferResult({
          referencia: 'OFFLINE-PENDIENTE',
          monto: parseInt(monto),
          contraparte: destinatario.nombre,
          nuevoSaldo: saldo - parseInt(monto),
          fecha: new Date().toLocaleDateString('es-CO', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })
        })
        toast.success(`⚠️ ¡Sin conexión! Transferencia encolada para envío automático al recuperar internet.`, { duration: 6000 })
      } catch (dbErr) {
        toast.error('Error al guardar la transferencia en la cola offline')
      } finally {
        setEnviando(false)
      }
      return
    }

    try {
      const res = await transferenciaService.enviar(
        dest,
        parseInt(monto),
        mensaje,
        pin
      )
      setTransferResult({
        referencia: res.data.referencia,
        monto: parseInt(monto),
        contraparte: destinatario.nombre,
        nuevoSaldo: res.data.nuevoSaldo,
        fecha: new Date().toLocaleDateString('es-CO', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      })
      toast.success(`¡${formatPts(monto)} enviados a ${destinatario.nombre}!`)
    } catch (err) {
      if (!err.response) {
        // Falló la red pero navigator dice online (por ejemplo, servidor inalcanzable)
        try {
          await dbOfflineQueue.addTransfer(dest, parseInt(monto), mensaje, pin)
          setTransferResult({
            referencia: 'OFFLINE-PENDIENTE',
            monto: parseInt(monto),
            contraparte: destinatario.nombre,
            nuevoSaldo: saldo - parseInt(monto),
            fecha: new Date().toLocaleDateString('es-CO', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })
          })
          toast.success(`⚠️ Servidor inalcanzable. Transferencia encolada de forma segura para envío automático en segundo plano.`, { duration: 6000 })
        } catch (dbErr) {
          toast.error('Error al guardar la transferencia en la cola offline')
        }
      } else {
        const msg = err.response?.data?.message || 'Error al realizar transferencia'
        toast.error(msg)
      }
    } finally {
      setEnviando(false)
    }
  }

  const handleVerificarQr = async () => {
    if (!payloadQrStr.trim()) {
      toast.error('Por favor, ingresa el payload firmado del QR.')
      return
    }

    setVerificandoQr(true)
    try {
      const parsedData = JSON.parse(payloadQrStr.trim())
      const res = await verificarQrCobro(parsedData)
      setQrVerificado(res.data)
      toast.success('🛡️ ¡Firma digital HMAC-SHA256 verificada con éxito!')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'El código QR es inválido, manipulado o ha expirado.')
    } finally {
      setVerificandoQr(false)
    }
  }

  const handlePagarQr = async () => {
    if (!pin || pin.length < 4) {
      toast.error('Ingresa tu PIN de seguridad.')
      return
    }

    setPagandoQr(true)
    try {
      const payload = {
        email: qrVerificado.destinatarioEmail,
        monto: qrVerificado.monto,
        mensaje: qrVerificado.mensaje,
        timestamp: qrVerificado.timestamp,
        signature: qrVerificado.signature,
        pin: pin
      }

      const res = await transferirPorQr(payload)

      setTransferResult({
        referencia: res.data.referencia,
        monto: qrVerificado.monto,
        contraparte: qrVerificado.destinatarioNombre,
        nuevoSaldo: res.data.nuevoSaldo,
        fecha: new Date().toLocaleDateString('es-CO', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      })

      setMostrarModalQr(false)
      setQrVerificado(null)
      setPayloadQrStr('')
      setPin('')
      toast.success('¡Transferencia P2P procesada con éxito!')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Error al procesar el cobro QR.')
    } finally {
      setPagandoQr(false)
    }
  }

  const tierColor = getTierColor(getTierFromOrden(user?.nivelVip || 1))

  if (transferResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          minHeight: '100vh',
          background: 'var(--color-background, #0a0a0a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
      >
        <div style={{
          maxWidth: 440,
          width: '100%',
          background: 'var(--color-background-primary, #1a1a1a)',
          borderRadius: 24,
          padding: '2rem',
          border: '1px solid #1D9E7540'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <CheckCircle size={56} color="#00C896" />
            </motion.div>
            <h2 style={{ color: '#fff', margin: '1rem 0 0.3rem', fontSize: '1.4rem' }}>
              Transferencia exitosa
            </h2>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>Los puntos se acreditaron al instante</p>
          </div>

          <div style={{
            background: 'rgba(0,200,150,0.06)',
            border: '1px solid rgba(0,200,150,0.15)',
            borderRadius: 16,
            padding: '1.25rem',
            marginBottom: '1rem'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Monto transferido</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#00C896' }}>{formatPts(transferResult.monto)}</div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                <span style={{ color: '#888' }}>Destinatario</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{transferResult.contraparte}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                <span style={{ color: '#888' }}>ID Transaccion</span>
                <span style={{ color: '#7dd3fc', fontWeight: 700, fontSize: '0.8rem' }}>{transferResult.referencia}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                <span style={{ color: '#888' }}>Fecha</span>
                <span style={{ color: '#fff' }}>{transferResult.fecha}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#888' }}>Nuevo saldo</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{formatPts(transferResult.nuevoSaldo)}</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,183,77,0.08)', borderRadius: 12, padding: '0.8rem 1rem', marginBottom: '1.5rem', border: '1px solid rgba(255,183,77,0.15)' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#FFB84D' }}>
              Los Puntos Tribu no son dinero real y solo se usan en la app.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setTransferResult(null)
              setStep(1)
              setBusqueda('')
              setDestinatario(null)
              setMonto('')
              setMensaje('')
              setPin('')
            }}
            style={{
              width: '100%',
              padding: '0.9rem',
              background: tierColor.primary,
              color: '#000',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '1rem',
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
                  ¿A quien quieres enviar?
                </h3>

                {/* Opción Premium: Pagar con QR de Cobro */}
                <div style={{
                  background: 'rgba(255, 87, 34, 0.05)',
                  border: '1px dashed rgba(255, 87, 34, 0.3)',
                  borderRadius: 12,
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#fff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    <Shield size={18} color="#FF5722" />
                    Pagar con QR de Cobro
                  </div>
                  <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 0.75rem' }}>
                    Pega el payload firmado del QR de cobro para realizar una transferencia digital inmediata.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMostrarModalQr(true)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #FF5722, #FF9800)',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(255, 87, 34, 0.15)'
                    }}
                  >
                    Abrir Escáner / Pegar Payload
                  </button>
                </div>

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
                    placeholder="Email o codigo TRIBU-XXXXX"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem 0.875rem 2.75rem',
                      background: 'var(--color-background-secondary, #2a2a2a)',
                      border: '1px solid var(--color-border-tertiary, #333)',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: '16px',
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

                {destinatario && destinatario.encontrado && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: 16,
                      padding: 16,
                      background: 'var(--color-background-secondary, #2a2a2a)',
                      borderRadius: 12,
                      border: `1px solid ${tierColor.primary}40`,
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: tierColor.primary,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#000', fontWeight: 700, fontSize: '1.1rem'
                      }}>
                        {destinatario.nombre?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: 600 }}>{destinatario.nombre}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <TierBadge tier={getTierFromOrden(destinatario.nivelVip || 1)} size="sm" />
                          {destinatario.ciudad && (
                            <span style={{ fontSize: '0.78rem', color: '#888' }}>{destinatario.ciudad}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#666', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
                      {destinatario.email && (
                        <div style={{ marginBottom: 2 }}>Email: {destinatario.email}</div>
                      )}
                      {destinatario.codigoReferido && (
                        <div>Codigo: {destinatario.codigoReferido}</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: destinatario?.encontrado ? 1.02 : 1 }}
                whileTap={{ scale: destinatario?.encontrado ? 0.98 : 1 }}
                disabled={!destinatario?.encontrado}
                onClick={() => setStep(2)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: destinatario?.encontrado ? tierColor.primary : '#333',
                  color: destinatario?.encontrado ? '#000' : '#666',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: destinatario?.encontrado ? 'pointer' : 'not-allowed',
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
                padding: '1rem 1.25rem',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ color: '#888', fontSize: '0.8rem', margin: 0 }}>Saldo disponible</p>
                  <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, margin: '2px 0 0' }}>
                    {formatPts(saldo)}
                  </p>
                </div>
                {limite && (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#888', fontSize: '0.75rem', margin: 0 }}>
                      Limite: {formatPts(limite.maximoPorTransferencia)} / trans.
                    </p>
                    <p style={{ color: '#666', fontSize: '0.75rem', margin: '2px 0 0' }}>
                      Hoy: {limite.transaccionesHoy}/{limite.limiteTransaccionesDiarias} trans.
                    </p>
                  </div>
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
                  {parseInt(monto || 0).toLocaleString('es-CO')} pts
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
                      {d === '⌫' ? '-' : d}
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
                      +{formatPts(amt)}
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
                  fontSize: '16px',
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
                padding: '1.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                  <Send size={24} color={tierColor.primary} />
                  <h3 style={{ color: '#fff', fontSize: '1.05rem', margin: 0 }}>
                    Confirmar transferencia
                  </h3>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>Destinatario</span>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{destinatario?.nombre}</span>
                  </div>
                  {destinatario?.email && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: '#888', fontSize: '0.85rem' }}>Email</span>
                      <span style={{ color: '#666', fontSize: '0.85rem' }}>{destinatario.email}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>Monto</span>
                    <span style={{ color: '#fff', fontWeight: 800 }}>{formatPts(monto)}</span>
                  </div>
                  {mensaje && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888', fontSize: '0.85rem' }}>Mensaje</span>
                      <span style={{ color: '#666', fontSize: '0.85rem', fontStyle: 'italic' }}>"{mensaje}"</span>
                    </div>
                  )}
                </div>

                <div style={{
                    background: 'rgba(226,75,74,0.06)',
                    border: '1px solid rgba(226,75,74,0.12)',
                    borderRadius: 10,
                    padding: '0.7rem 1rem',
                    marginBottom: '0.5rem'
                }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#E24B4A' }}>
                    Esta operacion no se puede deshacer una vez confirmada.
                  </p>
                </div>

                <div style={{
                    background: 'rgba(255,183,77,0.06)',
                    border: '1px solid rgba(255,183,77,0.12)',
                    borderRadius: 10,
                    padding: '0.7rem 1rem',
                    marginBottom: '1rem'
                }}>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#FFB84D', lineHeight: 1.4 }}>
                    Los Puntos Tribu no son dinero real. Las transferencias deben provenir de actividades lícitas.
                    El uso de esta plataforma para lavado de activos o financiación del terrorismo será reportado
                    a las autoridades competentes (UIAF, Fiscalía General de la Nación).
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Lock size={16} color="#FFB84D" />
                    <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>PIN de seguridad</span>
                  </div>
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ingresa tu PIN de 4-6 digitos"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      background: 'var(--color-background-secondary, #2a2a2a)',
                      border: '1px solid var(--color-border-tertiary, #333)',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: '16px',
                      textAlign: 'center',
                      letterSpacing: 12,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={enviando || pin.length < 4}
                onClick={handleTransferConfirm}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: pin.length >= 4 ? tierColor.primary : '#333',
                  color: pin.length >= 4 ? '#000' : '#666',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: pin.length >= 4 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {enviando ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Transferiendo...
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    Confirmar y enviar
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL PREMIUM DE PAGO CON QR FIRMADO */}
        <AnimatePresence>
          {mostrarModalQr && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '1rem'
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                style={{
                  background: 'rgba(26, 26, 26, 0.95)',
                  border: '1px solid rgba(255, 87, 34, 0.25)',
                  borderRadius: '24px',
                  padding: '2rem',
                  maxWidth: '440px',
                  width: '100%',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
                    ⚡ Escáner QR Digital
                  </h3>
                  <button
                    onClick={() => {
                      setMostrarModalQr(false)
                      setQrVerificado(null)
                      setPayloadQrStr('')
                      setPin('')
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#888',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ✕
                  </button>
                </div>

                {!qrVerificado ? (
                  // Sección para pegar el payload firmado
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <p style={{ color: '#aaa', fontSize: '0.88rem', margin: 0 }}>
                      Copia el texto del payload firmado que te compartió tu contraparte y pégalo abajo:
                    </p>
                    <textarea
                      placeholder='Pega el JSON de cobro firmado aquí...'
                      value={payloadQrStr}
                      onChange={(e) => setPayloadQrStr(e.target.value)}
                      style={{
                        width: '100%',
                        height: '120px',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#DDD',
                        fontFamily: 'monospace',
                        fontSize: '16px',
                        resize: 'none',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={handleVerificarQr}
                      disabled={verificandoQr}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #FF5722, #FF9800)',
                        color: '#FFF',
                        border: 'none',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(255, 87, 34, 0.25)',
                        transition: 'filter 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.filter = 'brightness(1.1)'}
                      onMouseOut={(e) => e.target.style.filter = 'none'}
                    >
                      {verificandoQr ? 'Verificando firma criptográfica...' : 'Validar y Continuar'}
                    </button>
                  </div>
                ) : (
                  // Sección de detalles del cobro verificado + PIN
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Tarjeta de verificación verde brillante con Escudo */}
                    <div style={{
                      background: 'rgba(0, 200, 150, 0.08)',
                      border: '1px solid rgba(0, 200, 150, 0.3)',
                      padding: '1rem',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <Shield size={24} color="#00C896" />
                      <div>
                        <div style={{ color: '#00C896', fontWeight: 800, fontSize: '0.88rem' }}>
                          FIRMA DIGITAL VERIFICADA
                        </div>
                        <div style={{ color: '#888', fontSize: '0.75rem' }}>
                          Autenticado por HMAC-SHA256
                        </div>
                      </div>
                    </div>

                    {/* Detalles del cobro */}
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      padding: '1.25rem',
                      borderRadius: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>Destinatario</div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFF' }}>{qrVerificado.destinatarioNombre}</div>

                      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>Monto a Transferir</div>
                      <div style={{ fontWeight: 950, fontSize: '1.75rem', color: '#FF5722' }}>{qrVerificado.monto?.toLocaleString()} Puntos Tribu</div>

                      {qrVerificado.mensaje && (
                        <>
                          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>Concepto</div>
                          <div style={{ color: '#DDD', fontSize: '0.9rem', fontStyle: 'italic' }}>"{qrVerificado.mensaje}"</div>
                        </>
                      )}
                    </div>

                    {/* PIN de seguridad */}
                    <div>
                      <label style={{ display: 'block', color: '#BBB', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        PIN de Seguridad
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ingresa tu PIN"
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '1.2rem',
                          textAlign: 'center',
                          letterSpacing: '8px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => setQrVerificado(null)}
                        style={{
                          flex: 1,
                          padding: '0.85rem',
                          borderRadius: '12px',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#FFF',
                          border: '1px solid rgba(255,255,255,0.1)',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Atrás
                      </button>

                      <button
                        onClick={handlePagarQr}
                        disabled={pagandoQr || pin.length < 4}
                        style={{
                          flex: 1,
                          padding: '0.85rem',
                          borderRadius: '12px',
                          background: pin.length >= 4 ? 'linear-gradient(135deg, #FF5722, #FF9800)' : '#333',
                          color: pin.length >= 4 ? '#FFF' : '#666',
                          border: 'none',
                          fontWeight: 800,
                          cursor: pin.length >= 4 ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {pagandoQr ? 'Procesando...' : 'Confirmar Pago'}
                      </button>
                    </div>

                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
