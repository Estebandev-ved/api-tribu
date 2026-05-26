import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Package, CheckCircle, Clock, XCircle, Plus, Upload } from 'lucide-react'
import profileService from '../../services/profileService'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const MOTIVOS = [
  'Producto dañado o defectuoso',
  'No era lo que esperaba',
  'Talla o medida incorrecta',
  'Llegó incompleto',
  'Me arrepentí de la compra',
  'Otro'
]

const ESTADOS_COLORS = {
  EN_REVISION: { bg: '#fef3c7', color: '#d97706' },
  ESPERANDO_DOCUMENTOS: { bg: '#dbeafe', color: '#2563eb' },
  APROBADA: { bg: '#d1fae5', color: '#059669' },
  RECHAZADA: { bg: '#fee2e2', color: '#dc2626' },
  REEMBOLSO_PROCESADO: { bg: '#d1fae5', color: '#059669' }
}

function SolicitarDevolucionForm({ pedidos, user, onSubmit, onCancel }) {
  const [pedidoId, setPedidoId] = useState('')
  const [productoId, setProductoId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [reembolsoTipo, setReembolsoTipo] = useState('saldo')
  const [fotos, setFotos] = useState([])
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async () => {
    if (!pedidoId || !productoId || !motivo) {
      toast.error('Completa los campos obligatorios')
      return
    }

    setEnviando(true)
    try {
      const pedidoSeleccionado = pedidos.find(p => String(p.id) === String(pedidoId))
      const productoSeleccionado = pedidoSeleccionado?.detalles?.find(d => String(d.productoId) === String(productoId))
      const payload = new FormData()
      const emailValue = user?.email || ''
      if (!emailValue) {
        toast.error('No pudimos identificar tu email')
        setEnviando(false)
        return
      }

      const data = {
        orderNumber: String(pedidoId),
        email: emailValue,
        reason: motivo,
        pedidoId: Number(pedidoId),
        productoId: Number(productoId),
        productoNombre: productoSeleccionado?.productoNombre || 'Producto'
      }
      const jsonPart = new Blob([JSON.stringify(data)], { type: 'application/json' })
      payload.append('data', jsonPart)
      if (fotos.length > 0) {
        payload.append('evidencia', fotos[0])
      }

      await profileService.solicitarDevolucion(payload)
      toast.success('Solicitud de devolución enviada')
      onSubmit()
    } catch (error) {
      toast.error('Error al enviar la solicitud')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
          ¿Qué pedido quieres devolver?
        </label>
        <select
          value={pedidoId}
          onChange={(e) => {
            setPedidoId(e.target.value)
            setProductoId('')
          }}
          style={{
            width: '100%',
            background: 'rgba(30,30,30,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem',
            padding: '0.875rem 1rem',
            color: 'var(--color-text)',
            fontSize: '0.95rem',
            outline: 'none'
          }}
        >
          <option value="">Selecciona un pedido</option>
          {pedidos.map(p => (
            <option key={p.id} value={p.id}>#{p.id} - {p.detalles?.[0]?.productoNombre || 'Pedido'}</option>
          ))}
        </select>
        <p style={{ color: 'var(--color-text-faint)', fontSize: '0.75rem', margin: '0.5rem 0 0' }}>
          Solo pedidos entregados en los últimos 30 días
        </p>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
          ¿Qué producto recibiste y quieres devolver?
        </label>
        <select
          value={productoId}
          onChange={(e) => setProductoId(e.target.value)}
          disabled={!pedidoId}
          style={{
            width: '100%',
            background: 'rgba(30,30,30,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem',
            padding: '0.875rem 1rem',
            color: 'var(--color-text)',
            fontSize: '0.95rem',
            outline: 'none',
            opacity: !pedidoId ? 0.6 : 1
          }}
        >
          <option value="">Selecciona un producto</option>
          {(pedidos.find(p => String(p.id) === String(pedidoId))?.detalles || []).map(d => (
            <option key={d.id} value={d.productoId}>#{d.productoId} - {d.productoNombre} (x{d.cantidad})</option>
          ))}
        </select>
        <p style={{ color: 'var(--color-text-faint)', fontSize: '0.75rem', margin: '0.5rem 0 0' }}>
          Escoge el producto exacto que deseas devolver
        </p>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          ¿Cuál es el motivo?
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {MOTIVOS.map(m => (
            <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="motivo"
                value={m}
                checked={motivo === m}
                onChange={(e) => setMotivo(e.target.value)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <span style={{ color: 'var(--color-text)', fontSize: '0.9rem' }}>{m}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
          Descripción (opcional)
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Cuéntanos más detalles..."
          rows={3}
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

      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          ¿Cómo quieres recibir el reembolso?
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="reembolso"
              value="saldo"
              checked={reembolsoTipo === 'saldo'}
              onChange={(e) => setReembolsoTipo(e.target.value)}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <span style={{ color: 'var(--color-text)', fontSize: '0.9rem' }}>Saldo en mi Tribu Card (inmediato)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="reembolso"
              value="original"
              checked={reembolsoTipo === 'original'}
              onChange={(e) => setReembolsoTipo(e.target.value)}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <span style={{ color: 'var(--color-text)', fontSize: '0.9rem' }}>Método de pago original (3-5 días)</span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem' }}>
        <button onClick={onCancel} className="btn btn-ghost" style={{ fontSize: '0.9rem' }}>
          Cancelar
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={enviando}
          className="btn btn-primary"
        >
          {enviando ? <div className="spinner" style={{ width: 16, height: 16 }} /> : 'Enviar solicitud'}
        </motion.button>
      </div>
    </div>
  )
}

export default function ProfileDevolucionesSection() {
  const { user } = useAuth()
  const [devoluciones, setDevoluciones] = useState([])
  const [pedidosEntregados, setPedidosEntregados] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [detalleDevolucion, setDetalleDevolucion] = useState(null)

  useEffect(() => {
    Promise.all([
      profileService.getMisDevoluciones().catch(() => ({ data: [] })),
      profileService.getPedidos().catch(() => ({ data: [] }))
    ])
      .then(([resDev, resPedidos]) => {
        setDevoluciones(resDev.data || [])
        const entregados = (resPedidos.data || []).filter(p => p.estado === 'ENTREGADO')
        setPedidosEntregados(entregados)
      })
      .finally(() => setLoading(false))
  }, [])

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
        ↩️ Devoluciones
      </h3>

      {!showForm && pedidosEntregados.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ 
            fontSize: '0.85rem', 
            color: 'var(--color-text-muted)', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Plus size={16} /> SOLICITAR NUEVA DEVOLUCIÓN
          </h4>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.9rem' }}
          >
            Nueva devolución
          </motion.button>
        </div>
      )}

      {showForm && (
        <div style={{ 
          background: 'rgba(30,30,30,0.8)', 
          borderRadius: '0.75rem', 
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <SolicitarDevolucionForm 
            pedidos={pedidosEntregados}
            user={user}
            onSubmit={() => {
              setShowForm(false)
              profileService.getMisDevoluciones().then(res => setDevoluciones(res.data || []))
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {devoluciones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <RotateCcw size={48} color="var(--color-text-faint)" />
          <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>No tienes devoluciones</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {devoluciones.map(dev => {
            const estadoColor = ESTADOS_COLORS[dev.estado] || ESTADOS_COLORS.EN_REVISION
            
            return (
              <motion.div
                key={dev.id}
                whileHover={{ y: -2 }}
                onClick={() => setDetalleDevolucion(dev)}
                style={{
                  background: 'rgba(30,30,30,0.8)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem' }}>#{dev.id}</span>
                  <p style={{ color: 'var(--color-text)', margin: '0.25rem 0 0' }}>{dev.productoNombre || dev.producto || 'Producto'}</p>
                  </div>
                  <span style={{
                    background: estadoColor.bg,
                    color: estadoColor.color,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {dev.estado?.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                  <span>Solicitud: {dev.fechaSolicitud || '-'}</span>
                  {dev.reembolso && <span>Reembolso: ${dev.reembolso.toLocaleString('es-CO')}</span>}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {detalleDevolucion && (
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
            onClick={() => setDetalleDevolucion(null)}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--color-text)', margin: 0 }}>Devolución #{detalleDevolucion.id}</h3>
                <button onClick={() => setDetalleDevolucion(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: '0 0 0.25rem' }}>Producto</p>
                  <p style={{ color: 'var(--color-text)', margin: 0 }}>{detalleDevolucion.productoNombre || detalleDevolucion.producto}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: '0 0 0.25rem' }}>Motivo</p>
                  <p style={{ color: 'var(--color-text)', margin: 0 }}>{detalleDevolucion.motivo}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>Estado</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {['SOLICITUD_RECIBIDA', 'EN_REVISION', 'ESPERANDO_DOCUMENTOS', 'APROBADA', 'REEMBOLSO_PROCESADO'].map((step, idx) => {
                      const activo = ['SOLICITUD_RECIBIDA', 'EN_REVISION', 'ESPERANDO_DOCUMENTOS'].includes(detalleDevolucion.estado) ? idx <= 1 : idx <= 4
                      return (
                        <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: 16, height: 16, borderRadius: '50%',
                            background: activo ? '#00C896' : 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {activo && <CheckCircle size={10} color="#fff" />}
                          </div>
                          <span style={{ color: activo ? 'var(--color-text)' : 'var(--color-text-faint)', fontSize: '0.8rem' }}>
                            {step.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
