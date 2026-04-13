import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Search, MessageCircle, Mail, Phone, ChevronDown, ChevronUp, Bug, Lightbulb, AlertTriangle, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const FAQS = [
  { pregunta: '¿Cómo funciona el cashback?', respuesta: 'El cashback es un porcentaje del valor de tu compra que se acredita a tu saldo de Tribu Card. Por ejemplo, si tienes 3% de cashback y compras por $100.000, recibirás $3.000 en tu saldo.' },
  { pregunta: '¿Cuándo se libera mi cashback?', respuesta: 'El cashback se libera 30 días después de la entrega del pedido. Esto es para asegurar que no haya devoluciones o cancelaciones.' },
  { pregunta: '¿Cómo rastreo mi pedido?', respuesta: 'Puedes ver el estado de tus pedidos en la sección "Mis pedidos". Cuando tu pedido sea enviado, verás el número de guía y podrás rastrearlo en tiempo real.' },
  { pregunta: '¿Cómo solicito una devolución?', respuesta: 'Ve a la sección "Devoluciones" y selecciona el pedido que quieres devolver. Elige el motivo, describe el problema y selecciona cómo quieres el reembolso.' },
  { pregunta: '¿Cómo transfiero dinero?', respuesta: 'En la sección "Billetera" puedes transferir dinero a otros usuarios de Tribu Card usando su número de teléfono o email registrado.' },
  { pregunta: '¿Cada cuánto puedo girar la ruleta?', respuesta: 'Puedes girar la ruleta una vez al día. El sistema verifica la fecha del último giro y te permite jugar si es un día diferente.' }
]

function FaqItem({ pregunta, respuesta }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setAbierto(!abierto)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '1rem 0',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left'
        }}
      >
        <span style={{ color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: 500 }}>
          {pregunta}
        </span>
        {abierto ? <ChevronUp size={18} color="var(--color-text-muted)" /> : <ChevronDown size={18} color="var(--color-text-muted)" />}
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', paddingBottom: '1rem' }}>
              {respuesta}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ReportarProblemaModal({ onClose }) {
  const [tipo, setTipo] = useState('bug')
  const [descripcion, setDescripcion] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async () => {
    if (!descripcion.trim()) {
      toast.error('Describe el problema')
      return
    }

    setEnviando(true)
    try {
      await fetch('/api/soporte/reportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, descripcion })
      })
      toast.success('Reporte enviado. Te responderemos en 24h.')
      onClose()
    } catch (error) {
      toast.error('Error al enviar el reporte')
    } finally {
      setEnviando(false)
    }
  }

  return (
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
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a1a',
          borderRadius: '1rem',
          padding: '1.5rem',
          maxWidth: 400,
          width: '100%'
        }}
      >
        <h3 style={{ color: 'var(--color-text)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bug size={20} color="#ff4d4d" /> Reportar un problema
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Tipo
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { value: 'bug', label: 'Bug', icon: Bug },
                { value: 'sugerencia', label: 'Sugerencia', icon: Lightbulb },
                { value: 'queja', label: 'Queja', icon: AlertTriangle },
                { value: 'otro', label: 'Otro', icon: HelpCircle }
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => setTipo(item.value)}
                  style={{
                    background: tipo === item.value ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <item.icon size={14} /> {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Cuéntanos qué pasó..."
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(30,30,30,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.5rem',
                padding: '0.875rem 1rem',
                color: 'var(--color-text)',
                fontSize: '0.95rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
              Cancelar
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={enviando}
              style={{
                background: 'var(--color-primary)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                cursor: enviando ? 'not-allowed' : 'pointer',
                color: '#fff',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {enviando ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <><Send size={14} /> Enviar</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ProfileAyudaSection() {
  const [busqueda, setBusqueda] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)

  const faqsFiltrados = FAQS.filter(faq => 
    !busqueda || 
    faq.pregunta.toLowerCase().includes(busqueda.toLowerCase()) ||
    faq.respuesta.toLowerCase().includes(busqueda.toLowerCase())
  )

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
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        ❓ Centro de ayuda
      </h3>

      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search 
          size={16} 
          style={{ 
            position: 'absolute', 
            left: 12, 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)'
          }} 
        />
        <input
          type="text"
          placeholder="Buscar en ayuda..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            background: 'rgba(30,30,30,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem',
            padding: '0.875rem 1rem 0.875rem 2.5rem',
            color: 'var(--color-text)',
            fontSize: '0.95rem',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ 
          fontSize: '0.8rem', 
          color: 'var(--color-text-muted)', 
          marginBottom: '1rem'
        }}>
          TEMAS FRECUENTES
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {faqsFiltrados.map((faq, idx) => (
            <FaqItem key={idx} {...faq} />
          ))}
        </div>
      </div>

      <div style={{ 
        background: 'rgba(30,30,30,0.8)', 
        borderRadius: '0.75rem', 
        padding: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        <h4 style={{ 
          fontSize: '0.8rem', 
          color: 'var(--color-text-muted)', 
          marginBottom: '1rem'
        }}>
          CONTACTO DIRECTO
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              background: '#25D366',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MessageCircle size={18} />
              <span>Chat en vivo</span>
            </div>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>disponible 8am-8pm</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              color: 'var(--color-text)',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={18} />
              <span>Enviar email</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>respuesta en 24h</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              color: 'var(--color-text)',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Phone size={18} />
              <span>WhatsApp</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>respuesta en 2h</span>
          </motion.button>
        </div>
      </div>

      <div style={{ 
        borderTop: '1px solid rgba(255,255,255,0.08)', 
        paddingTop: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <span style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>
          Versión de la app: 2.4.1
        </span>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowReportModal(true)}
          style={{
            background: 'transparent',
            border: '1px solid #ff4d4d',
            color: '#ff4d4d',
            borderRadius: '0.5rem',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          Reportar un problema
        </motion.button>
      </div>

      <AnimatePresence>
        {showReportModal && (
          <ReportarProblemaModal onClose={() => setShowReportModal(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}