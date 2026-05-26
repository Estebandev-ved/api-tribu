import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Phone, MessageSquare, X, Send } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Google Analytics / Hotjar Mock Tracker ──
export const trackConversionEvent = (eventName, eventData = {}) => {
  console.log(`[Analytics Engine (GA/Hotjar)] Event: ${eventName}`, eventData)
  if (window.gtag) {
    window.gtag('event', eventName, eventData)
  }
}

export default function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [quickMsg, setQuickMsg] = useState('')

  const handleWhatsAppRedirect = () => {
    trackConversionEvent('whatsapp_click', { time: new Date().toISOString() })
    window.open('https://wa.me/573000000000?text=Hola%20Tribu!%20Necesito%20ayuda%20con%20mi%20pedido', '_blank')
  }

  const handleSendQuickTicket = () => {
    if (!quickMsg.trim()) return
    trackConversionEvent('quick_ticket_submit', { length: quickMsg.length })
    toast.success('¡Consulta enviada! Puedes reanudarla desde tu Perfil > Ayuda.')
    setQuickMsg('')
    setIsOpen(false)
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="glass-panel"
            style={{
              position: 'absolute',
              bottom: 80,
              right: 0,
              width: 320,
              borderRadius: 20,
              padding: '1.25rem',
              boxShadow: 'var(--shadow-orange)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              color: 'var(--color-text)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>Soporte Tribu ⚡</span>
              <button 
                onClick={() => setIsOpen(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
              ¿Tienes alguna duda sobre tus compras o tus Puntos Tribu? ¡Estamos aquí para ayudarte 24/7!
            </p>

            {/* WhatsApp Link Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleWhatsAppRedirect}
              style={{
                background: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
              }}
            >
              <Phone size={16} />
              Escríbenos por WhatsApp
            </motion.button>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                Enviar consulta rápida a la IA
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="¿Cómo gano cashback?..."
                  value={quickMsg}
                  onChange={(e) => setQuickMsg(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleSendQuickTicket}
                  disabled={!quickMsg.trim()}
                  style={{
                    background: 'var(--color-primary)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    color: '#fff',
                    cursor: quickMsg.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsOpen(!isOpen)
          trackConversionEvent('floating_widget_toggle', { state: !isOpen })
        }}
        style={{
          background: 'linear-gradient(135deg, var(--color-primary), #ff7a45)',
          border: 'none',
          borderRadius: '50%',
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(255, 87, 34, 0.4)',
          position: 'relative'
        }}
      >
        <MessageCircle size={24} />
      </motion.button>
    </div>
  )
}
