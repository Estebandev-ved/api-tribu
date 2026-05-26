import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HelpCircle, Search, MessageCircle, Mail, Phone, ChevronDown, ChevronUp, 
  Bug, Lightbulb, AlertTriangle, Send, ArrowLeft, Bot, Sparkles, User, Clock, Check, MessageSquare
} from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  iniciarConversacionSoporte, 
  getMisConversacionesSoporte, 
  getMensajesConversacionSoporte, 
  enviarMensajeSoporte 
} from '../../api'
import profileService from '../../services/profileService'

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
  
  // ——— Estados del Chat de Soporte ———
  const [conversaciones, setConversaciones] = useState([])
  const [conversacionActiva, setConversacionActiva] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [misPedidos, setMisPedidos] = useState([])
  const [pedidoIdVincular, setPedidoIdVincular] = useState('')

  const pollingRef = useRef(null)
  const chatBottomRef = useRef(null)

  const faqsFiltrados = FAQS.filter(faq => 
    !busqueda || 
    faq.pregunta.toLowerCase().includes(busqueda.toLowerCase()) ||
    faq.respuesta.toLowerCase().includes(busqueda.toLowerCase())
  )

  // Cargar tickets de soporte y pedidos al iniciar
  useEffect(() => {
    cargarSoporte()
    profileService.getPedidos()
      .then(res => setMisPedidos(res.data || []))
      .catch(err => console.error('Error al cargar pedidos para soporte', err))
  }, [])

  // Auto-scroll al final del chat cuando hay nuevos mensajes
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensajes])

  // Polling de mensajes de la conversación activa
  useEffect(() => {
    if (conversacionActiva) {
      // Iniciar polling cada 4 segundos
      pollingRef.current = setInterval(() => {
        getMensajesConversacionSoporte(conversacionActiva.id)
          .then(res => {
            // Solo actualizar si hay cambios en la longitud o contenido del último mensaje
            if (res.data && res.data.length !== mensajes.length) {
              setMensajes(res.data)
            }
          })
          .catch(err => console.error('Error en polling de soporte', err))
      }, 4000)
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [conversacionActiva, mensajes.length])

  const cargarSoporte = async () => {
    try {
      const res = await getMisConversacionesSoporte()
      setConversaciones(res.data || [])
    } catch (error) {
      console.error('Error al cargar conversaciones de soporte', error)
    }
  }

  const handleIniciarChat = async (pedidoId = null) => {
    setCargando(true)
    try {
      const res = await iniciarConversacionSoporte(pedidoId)
      const conv = res.data
      setConversacionActiva(conv)
      
      // Cargar mensajes iniciales
      const resMsg = await getMensajesConversacionSoporte(conv.id)
      setMensajes(resMsg.data || [])
      
      // Actualizar listado de conversaciones
      await cargarSoporte()
    } catch (error) {
      toast.error('No se pudo iniciar el chat de soporte en vivo')
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const handleEnviarMensaje = async (e) => {
    if (e) e.preventDefault()
    if (!nuevoMensaje.trim() || enviando) return

    const texto = nuevoMensaje
    setNuevoMensaje('')
    setEnviando(true)

    // Agregar mensaje localmente para feedback inmediato
    const msgLocal = {
      id: Date.now(),
      remitente: 'USUARIO',
      contenido: texto,
      fechaCreacion: new Date().toISOString()
    }
    setMensajes(prev => [...prev, msgLocal])

    try {
      const res = await enviarMensajeSoporte(conversacionActiva.id, texto)
      
      // Volver a cargar todos los mensajes (incluyendo respuesta de la IA si la hay)
      const resMsg = await getMensajesConversacionSoporte(conversacionActiva.id)
      setMensajes(resMsg.data || [])
      
      // Recargar la conversación para ver si el estado cambió (ej. escalada a humano)
      const resConv = await getMisConversacionesSoporte()
      const actualizada = resConv.data?.find(c => c.id === conversacionActiva.id)
      if (actualizada) {
        setConversacionActiva(actualizada)
      }
    } catch (error) {
      toast.error('Error al enviar el mensaje')
    } finally {
      setEnviando(false)
    }
  }

  const handleVincularPedido = async (idPedido) => {
    if (!idPedido) return
    try {
      setCargando(true)
      const res = await iniciarConversacionSoporte(Number(idPedido))
      setConversacionActiva(res.data)
      toast.success(`Pedido #${idPedido} vinculado con éxito al chat`)
      
      // Recargar mensajes
      const resMsg = await getMensajesConversacionSoporte(res.data.id)
      setMensajes(resMsg.data || [])
      await cargarSoporte()
    } catch (error) {
      toast.error('Error al vincular el pedido')
    } finally {
      setCargando(false)
    }
  }

  const handleSalirChat = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
    setConversacionActiva(null)
    setMensajes([])
    cargarSoporte()
  }

  // Filtrar si hay algún ticket activo (no resuelto)
  const ticketActivo = conversaciones.find(c => c.estado !== 'RESUELTA')

  // Renderizar la vista de CHAT EN VIVO si está activa
  if (conversacionActiva) {
    const estado = conversacionActiva.estado
    const estadoEtiqueta = estado === 'ACTIVA_IA' ? 'Agente IA' : estado === 'ESCALADA_HUMANO' ? 'Asesor Humano' : 'Resuelto'
    const colorEstado = estado === 'ACTIVA_IA' ? '#7c3aed' : estado === 'ESCALADA_HUMANO' ? 'var(--color-primary)' : 'var(--color-success)'
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'rgba(20,20,20,0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '1rem',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          height: '600px'
        }}
      >
        {/* Cabecera del Chat */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleSalirChat}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {estado === 'ACTIVA_IA' ? <Bot size={16} color="#a78bfa" /> : <User size={16} color="var(--color-primary)" />}
                {estado === 'ACTIVA_IA' ? 'Asistente Tribu IA' : 'Soporte Humano Tribu'}
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C896', display: 'inline-block' }} />
                En línea ahora
              </span>
            </div>
          </div>

          <span style={{
            background: `${colorEstado}20`,
            color: colorEstado,
            border: `1px solid ${colorEstado}40`,
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {estadoEtiqueta}
          </span>
        </div>

        {/* Notificación de Pedido Relacionado */}
        {conversacionActiva.pedido && (
          <div style={{
            background: 'rgba(255, 87, 34, 0.08)',
            border: '1px solid rgba(255, 87, 34, 0.15)',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: 'var(--color-text-muted)' }}>
              📦 Chat vinculado al **Pedido #{conversacionActiva.pedido.id}**
            </span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              ${conversacionActiva.pedido.total?.toLocaleString('es-CO')}
            </span>
          </div>
        )}

        {/* Zona de Mensajes */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {mensajes.map((msg, index) => {
            const esUsuario = msg.remitente === 'USUARIO'
            
            return (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  alignSelf: esUsuario ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: esUsuario ? 'flex-end' : 'flex-start'
                }}
              >
                {/* Nombre de quien envía */}
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', marginBottom: '0.25rem' }}>
                  {esUsuario ? 'Tú' : msg.remitente === 'IA' ? 'Tribu IA 🤖' : 'Asesor 🧑‍💻'}
                </span>
                
                {/* Burbuja de Mensaje */}
                <div style={{
                  background: esUsuario 
                    ? 'linear-gradient(135deg, #7c3aed, #9333ea)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: esUsuario 
                    ? 'none' 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: esUsuario 
                    ? '12px 12px 2px 12px' 
                    : '12px 12px 12px 2px',
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  fontSize: '0.88rem',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.contenido}
                </div>

                {/* Hora y estado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-faint)' }}>
                    {msg.fechaCreacion ? new Date(msg.fechaCreacion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  {esUsuario && <Check size={10} color="var(--color-text-faint)" />}
                </div>
              </motion.div>
            )
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Acciones de vinculación de pedido (Si no hay vinculado aún) */}
        {!conversacionActiva.pedido && misPedidos.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            marginBottom: '0.75rem',
            border: '1px dashed rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} color="var(--color-accent)" /> ¿Tu duda es sobre un pedido reciente?
            </span>
            <select
              value={pedidoIdVincular}
              onChange={(e) => {
                setPedidoIdVincular(e.target.value)
                handleVincularPedido(e.target.value)
              }}
              style={{
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.25rem',
                color: '#fff',
                fontSize: '0.75rem',
                padding: '2px 8px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">Seleccionar pedido...</option>
              {misPedidos.slice(0, 5).map(p => (
                <option key={p.id} value={p.id}>Pedido #{p.id} (${p.total?.toLocaleString('es-CO')})</option>
              ))}
            </select>
          </div>
        )}

        {/* Input para escribir mensaje */}
        {estado === 'RESUELTA' ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '0.5rem',
            padding: '1rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            Esta conversación está marcada como resuelta. Si tienes más dudas, vuelve atrás e inicia un nuevo chat.
          </div>
        ) : (
          <form onSubmit={handleEnviarMensaje} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Escribe tu mensaje aquí..."
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              disabled={enviando}
              style={{
                flex: 1,
                background: 'rgba(30,30,30,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={enviando || !nuevoMensaje.trim()}
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), #ff7a45)',
                border: 'none',
                borderRadius: '0.5rem',
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: enviando || !nuevoMensaje.trim() ? 'not-allowed' : 'pointer',
                color: '#fff',
                opacity: enviando || !nuevoMensaje.trim() ? 0.6 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </motion.div>
    )
  }

  // Vista Principal de Soporte
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

      {/* Alerta de Ticket Activo (Si existe) */}
      {ticketActivo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(255, 87, 34, 0.1))',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{
              background: 'rgba(124, 58, 237, 0.2)',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageSquare size={20} color="#a78bfa" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>Tienes un chat de soporte en curso</h4>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Estado: **{ticketActivo.estado === 'ACTIVA_IA' ? 'IA Asistente' : 'Escalado a Humano'}** · Actualizado recientemente
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setConversacionActiva(ticketActivo)
              getMensajesConversacionSoporte(ticketActivo.id)
                .then(res => setMensajes(res.data || []))
            }}
            className="btn btn-primary"
            style={{
              padding: '0.5rem 1.2rem',
              fontSize: '0.8rem',
              background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
            }}
          >
            Reanudar chat 💬
          </button>
        </motion.div>
      )}

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
            onClick={() => handleIniciarChat(null)}
            disabled={cargando}
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), #ff7a45)',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              cursor: cargando ? 'not-allowed' : 'pointer',
              color: '#fff',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-orange)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MessageCircle size={18} />
              <span style={{ fontWeight: 700 }}>Iniciar Chat en Vivo (IA + Humano)</span>
            </div>
            <span style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 600 }}>¡Respuesta instantánea! ⚡</span>
          </motion.button>

          <motion.a
            href="mailto:soporte@tribucard.com"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              color: 'var(--color-text)',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              justifyContent: 'space-between',
              textDecoration: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={18} />
              <span>Enviar correo de soporte</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>respuesta en 24h</span>
          </motion.a>

          <motion.a
            href="https://wa.me/573000000000"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              color: 'var(--color-text)',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              justifyContent: 'space-between',
              textDecoration: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Phone size={18} />
              <span>WhatsApp de Ventas</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>respuesta en 2h</span>
          </motion.a>
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
          Versión de la app: 2.5.0 (Soporte IA integrado)
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