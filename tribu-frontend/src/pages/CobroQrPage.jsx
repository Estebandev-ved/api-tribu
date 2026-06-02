import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generarQrCobro } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import AgeVerification from '../components/AgeVerification'

export default function CobroQrPage() {
  const { user } = useAuth()
  const [monto, setMonto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [qrBase64, setQrBase64] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [timeLeft, setTimeLeft] = useState(900) // 15 Minutos en segundos

  // Manejar cuenta regresiva una vez generado el QR
  useEffect(() => {
    if (!qrBase64) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setQrBase64(null)
          setQrData(null)
          toast.error('El código QR de cobro ha expirado.')
          clearInterval(timer)
          return 900
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [qrBase64])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleGenerarCobro = async (e) => {
    e.preventDefault()
    if (!monto || parseFloat(monto) <= 0) {
      toast.error('Por favor, ingresa un monto válido mayor a 0.')
      return
    }

    setLoading(true)
    try {
      const response = await generarQrCobro({
        monto: parseFloat(monto),
        mensaje: mensaje.trim()
      })
      setQrBase64(response.data.qrBase64)
      setQrData(response.data.rawPayload)
      setTimeLeft(900)
      toast.success('¡Código QR de cobro generado con firma HMAC-SHA256!')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Error al generar el código QR.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopiarEnlace = () => {
    if (!qrData) return
    try {
      navigator.clipboard.writeText(JSON.stringify(qrData))
      toast.success('¡Payload de cobro firmado copiado al portapapeles!')
    } catch (e) {
      toast.error('No se pudo copiar el enlace.')
    }
  }

  return (
    <AgeVerification feature="qr-cobro">
      <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '1rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(26, 26, 26, 0.75)',
            border: '1px solid rgba(255, 87, 34, 0.15)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              fontSize: '3rem',
              background: 'linear-gradient(135deg, #FF5722, #FF9800)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 900,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              ⚡ Cobro QR
            </div>
            <p style={{ color: '#888', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              Genera un código QR dinámico firmado criptográficamente para recibir pagos P2P al instante.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!qrBase64 ? (
              // Formulario de generación
              <motion.form
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleGenerarCobro}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div>
                  <label style={{ display: 'block', color: '#BBB', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', tracking: '0.05em' }}>
                    Monto a Cobrar (pts)
                  </label>
                  <input
                    type="number"
                    placeholder="Ej. 15000"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFF',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#BBB', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', tracking: '0.05em' }}>
                    Concepto / Mensaje (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Pago de cena, almuerzo, etc."
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFF',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #FF5722, #FF9800)',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(255, 87, 34, 0.3)',
                    transition: 'transform 0.2s, filter 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.filter = 'brightness(1.1)'}
                  onMouseOut={(e) => e.target.style.filter = 'none'}
                >
                  {loading ? 'Firmando y Generando...' : 'Generar QR Firmado'}
                </button>
              </motion.form>
            ) : (
              // Código QR Generado
              <motion.div
                key="qr"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}
              >
                {/* Visualizador de QR con animaciones y bordes premium */}
                <div style={{
                  padding: '1.5rem',
                  background: '#FFF',
                  borderRadius: '24px',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '4px solid #FF5722'
                }}>
                  {/* Escáner animado sobre el QR */}
                  <motion.div
                    animate={{ y: [0, 250, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'rgba(255, 87, 34, 0.8)',
                      boxShadow: '0 0 10px #FF5722, 0 0 20px #FF9800',
                      zIndex: 10
                    }}
                  />
                  <img
                    src={qrBase64}
                    alt="Código QR de Cobro"
                    style={{ width: '250px', height: '250px', display: 'block', borderRadius: '12px' }}
                  />
                </div>

                {/* Detalles de la transacción */}
                <div style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '1.25rem',
                  borderRadius: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>Destinatario</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFF' }}>{user.nombreCompleto}</div>
                  
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>Monto del Cobro</div>
                  <div style={{ fontWeight: 950, fontSize: '2rem', color: '#FF5722' }}>{parseFloat(monto).toLocaleString()} pts</div>

                  {mensaje && (
                    <>
                      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>Concepto</div>
                      <div style={{ color: '#DDD', fontSize: '0.95rem', fontStyle: 'italic' }}>"{mensaje}"</div>
                    </>
                  )}
                </div>

                {/* Temporizador de Expiración */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#FFB300',
                  fontWeight: 700,
                  background: 'rgba(255, 179, 0, 0.1)',
                  padding: '0.5rem 1rem',
                  borderRadius: '30px',
                  fontSize: '0.9rem',
                  border: '1px solid rgba(255, 179, 0, 0.2)'
                }}>
                  ⏳ Expira en: <span style={{ fontSize: '1.05rem', fontWeight: 900 }}>{formatTime(timeLeft)}</span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                  <button
                    onClick={() => {
                      setQrBase64(null)
                      setQrData(null)
                      setMonto('')
                      setMensaje('')
                    }}
                    style={{
                      flex: 1,
                      padding: '0.85rem',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#FFF',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    Nuevo Cobro
                  </button>

                  <button
                    onClick={handleCopiarEnlace}
                    style={{
                      flex: 1,
                      padding: '0.85rem',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #FF5722, #FF9800)',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(255, 87, 34, 0.2)',
                      transition: 'filter 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.filter = 'brightness(1.1)'}
                    onMouseOut={(e) => e.target.style.filter = 'none'}
                  >
                    Copiar Payload
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AgeVerification>
  )
}
