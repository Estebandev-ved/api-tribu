import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Phone, 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  ShieldAlert,
  Loader,
  CornerDownRight,
  LogIn
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { 
  iniciarConversacionSoporte, 
  getMisConversacionesSoporte, 
  getMensajesConversacionSoporte, 
  enviarMensajeSoporte 
} from '../api'

// ── Google Analytics / Hotjar Mock Tracker ──
export const trackConversionEvent = (eventName, eventData = {}) => {
  console.log(`[Analytics Engine (GA/Hotjar)] Event: ${eventName}`, eventData)
  if (window.gtag) {
    window.gtag('event', eventName, eventData)
  }
}

export default function HelpWidget() {
  const { isAuthenticated, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [conversacion, setConversacion] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [inputMsg, setInputMsg] = useState('')
  
  // Loading states
  const [loadingConv, setLoadingConv] = useState(false)
  const [sending, setSending] = useState(false)
  
  const messagesEndRef = useRef(null)
  const isFirstLoad = useRef(true)

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      cargarConversacionActiva()
    }
  }, [isOpen, isAuthenticated])

  useEffect(() => {
    scrollToBottom()
  }, [mensajes])

  const cargarConversacionActiva = async () => {
    setLoadingConv(true)
    try {
      const res = await getMisConversacionesSoporte()
      // Si el usuario tiene conversaciones, tomamos la más reciente que no esté RESUELTA, o simplemente la última
      if (res.data && res.data.length > 0) {
        // Buscar una que no esté resuelta
        const activa = res.data.find(c => c.estado !== 'RESUELTA') || res.data[0]
        setConversacion(activa)
        await cargarMensajes(activa.id)
      } else {
        // Si no tiene, iniciamos una automáticamente
        await handleCrearConversacion()
      }
    } catch (err) {
      console.error('Error al cargar conversación activa:', err)
    } finally {
      setLoadingConv(false)
    }
  }

  const cargarMensajes = async (convId) => {
    try {
      const res = await getMensajesConversacionSoporte(convId)
      setMensajes(res.data || [])
    } catch (err) {
      console.error('Error al cargar mensajes:', err)
    }
  }

  const handleCrearConversacion = async () => {
    try {
      const res = await iniciarConversacionSoporte(null)
      setConversacion(res.data)
      await cargarMensajes(res.data.id)
    } catch (err) {
      console.error('Error al iniciar conversación:', err)
      toast.error('No se pudo invocar al Guía de la Tribu')
    }
  }

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMsg
    if (!text.trim() || !conversacion || sending) return

    if (!textToSend) setInputMsg('')
    setSending(true)

    // Agregar el mensaje del usuario inmediatamente al estado local para feedback instantáneo
    const tempUserMsg = {
      id: Date.now(),
      remitente: 'USUARIO',
      contenido: text,
      fechaCreacion: new Date().toISOString()
    }
    setMensajes(prev => [...prev, tempUserMsg])

    trackConversionEvent('support_message_sent', { length: text.length })

    try {
      const res = await enviarMensajeSoporte(conversacion.id, text)
      // El backend devuelve el mensaje que se procesó (o el de la IA si responde)
      // Para asegurar que tenemos todo sincronizado, volvemos a cargar los mensajes
      await cargarMensajes(conversacion.id)
    } catch (err) {
      console.error('Error al enviar mensaje:', err)
      toast.error('Error al enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  const handleWhatsAppRedirect = () => {
    trackConversionEvent('whatsapp_click', { time: new Date().toISOString() })
    window.open('https://wa.me/573000000000?text=Hola%20Tribu!%20Necesito%20ayuda%20con%20mi%20pedido', '_blank')
  }

  const getBubbleStyle = (remitente) => {
    switch (remitente) {
      case 'IA':
        return {
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: '#e2e8f0',
          alignSelf: 'flex-start',
          borderRadius: '16px 16px 16px 4px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }
      case 'ADMIN':
        return {
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          color: '#f8fafc',
          alignSelf: 'flex-start',
          borderRadius: '16px 16px 16px 4px',
          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.1)'
        }
      case 'USUARIO':
      default:
        return {
          background: 'linear-gradient(135deg, var(--color-primary, #FF5722), #ff7a45)',
          border: 'none',
          color: '#000',
          fontWeight: 700,
          alignSelf: 'flex-end',
          borderRadius: '16px 16px 4px 16px',
          boxShadow: '0 4px 12px rgba(255, 87, 34, 0.2)'
        }
    }
  }

  const quickPills = [
    { label: '📦 Rastrear Pedido', query: '¿Dónde está mi pedido o compra?' },
    { label: '💳 Saldo & VIP', query: '¿Cuál es mi saldo actual, estatus VIP y racha?' },
    { label: '♻️ Devoluciones', query: '¿Cómo funciona una devolución y garantía?' },
    { label: '🚨 Hablar con Humano', query: 'Quiero hablar con soporte humano inmediatamente por favor.' }
  ]

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      {/* Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            style={{
              position: 'absolute',
              bottom: 72,
              right: 0,
              width: 360,
              height: 520,
              borderRadius: '24px',
              background: 'rgba(20, 20, 20, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              color: '#fff'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1.25rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '12px',
                    background: 'rgba(255, 87, 34, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-primary, #FF5722)',
                    border: '1px solid rgba(255, 87, 34, 0.2)'
                  }}>
                    {conversacion?.estado === 'ESCALADA_HUMANO' ? <ShieldAlert size={22} color="#ef4444" /> : <Bot size={22} />}
                  </div>
                  <span style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 12, height: 12, borderRadius: '50%',
                    background: conversacion?.estado === 'ESCALADA_HUMANO' ? '#ef4444' : '#10b981',
                    border: '2px solid rgba(20, 20, 20, 1)'
                  }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {conversacion?.estado === 'ESCALADA_HUMANO' ? 'Asesor Humano 🛡️' : 'Guía de la Tribu 🤖'}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint, #6b7280)', fontWeight: 600 }}>
                    {conversacion?.estado === 'ESCALADA_HUMANO' ? 'Soporte prioritario activo' : 'IA soporte 24/7 activo'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Switcher */}
            {!isAuthenticated ? (
              /* Non authenticated user view */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', gap: '1.25rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '20px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)', color: '#888' }}>
                  <Bot size={32} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Invocar al Guía Virtual</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.45 }}>
                    Para chatear en tiempo real con la IA de la Tribu, consultar tus pedidos y ver tus puntos acumulados, por favor inicia sesión.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    window.location.href = '/login'
                  }}
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary, #FF5722), #ff7a45)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem 1.5rem',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    color: '#000',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(255, 87, 34, 0.2)'
                  }}
                >
                  <LogIn size={16} />
                  Iniciar Sesión
                </button>
              </div>
            ) : loadingConv ? (
              /* Loading screen */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#888' }}>
                <Loader size={28} className="animate-spin" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cargando bitácora de soporte...</span>
              </div>
            ) : (
              /* Chat log and input screen */
              <>
                {/* Message Log */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}>
                  {mensajes.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem', padding: '1rem' }}>
                      Cargando saludo del consejero...
                    </div>
                  ) : (
                    mensajes.map((m) => (
                      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: m.remitente === 'USUARIO' ? 'flex-end' : 'flex-start' }}>
                        {/* Sender Label */}
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginBottom: '2px', marginLeft: m.remitente === 'USUARIO' ? 0 : '4px', marginRight: m.remitente === 'USUARIO' ? '4px' : 0 }}>
                          {m.remitente === 'IA' ? '🌿 GUÍA IA' : m.remitente === 'ADMIN' ? '🛡️ ASESOR' : 'TÚ'}
                        </span>
                        
                        {/* Bubble */}
                        <div style={{
                          padding: '0.75rem 0.9rem',
                          maxWidth: '85%',
                          fontSize: '0.82rem',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-line',
                          ...getBubbleStyle(m.remitente)
                        }}>
                          {m.contenido}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Sending/Typing Ellipsis */}
                  {sending && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginBottom: '2px', marginLeft: '4px' }}>
                        🌿 GUÍA IA
                      </span>
                      <div style={{
                        padding: '0.75rem 1rem',
                        background: 'rgba(16, 185, 129, 0.04)',
                        border: '1px solid rgba(16, 185, 129, 0.1)',
                        color: 'rgba(255,255,255,0.5)',
                        borderRadius: '16px 16px 16px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <span style={{ fontSize: '0.8rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Loader size={12} className="animate-spin" />
                          Meditando respuesta...
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Action Pills */}
                <div style={{
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  gap: '0.4rem',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                  background: 'rgba(0,0,0,0.1)',
                  borderTop: '1px solid rgba(255,255,255,0.03)',
                  scrollbarWidth: 'none'
                }}>
                  {quickPills.map((pill, i) => (
                    <button
                      key={i}
                      disabled={sending}
                      onClick={() => handleSendMessage(pill.query)}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        padding: '0.4rem 0.75rem',
                        color: pill.label.startsWith('🚨') ? '#ef4444' : '#e2e8f0',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: sending ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { if (!sending) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                      onMouseLeave={(e) => { if (!sending) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                {/* Chat Input & WhatsApp Alternative */}
                <div style={{
                  padding: '0.85rem',
                  background: 'rgba(15, 15, 15, 0.95)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder={conversacion?.estado === 'ESCALADA_HUMANO' ? "Escribe al asesor..." : "Pregúntale a la IA de la Tribu..."}
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage() }}
                      disabled={sending}
                      style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.82rem',
                        color: '#fff',
                        outline: 'none',
                        transition: 'border 0.2s'
                      }}
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputMsg.trim() || sending}
                      style={{
                        background: inputMsg.trim() && !sending ? 'linear-gradient(135deg, var(--color-primary, #FF5722), #ff7a45)' : 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: '12px',
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: inputMsg.trim() && !sending ? '#000' : '#888',
                        cursor: inputMsg.trim() && !sending ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Send size={15} />
                    </button>
                  </div>
                  
                  {/* Footer links: WhatsApp redirect fallback */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      Tribu AI Concierge v2.0
                    </span>
                    <button 
                      onClick={handleWhatsAppRedirect}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#25D366',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '6px'
                      }}
                    >
                      <Phone size={10} /> WhatsApp
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.08, rotate: 3 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          setIsOpen(!isOpen)
          trackConversionEvent('floating_widget_toggle', { state: !isOpen })
        }}
        style={{
          background: 'linear-gradient(135deg, var(--color-primary, #FF5722), #ff7a45)',
          border: 'none',
          borderRadius: '50%',
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(255, 87, 34, 0.35)',
          position: 'relative'
        }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </div>
  )
}
