import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Search, ChevronDown, MapPin, Truck, CheckCircle, XCircle, Clock } from 'lucide-react'
import profileService from '../../services/profileService'
import toast from 'react-hot-toast'

const ESTADOS_COLORES = {
  PENDIENTE: { bg: 'rgba(128,128,128,0.2)', color: '#888' },
  EN_PREPARACION: { bg: 'rgba(59,130,246,0.2)', color: '#3b82f6' },
  ENVIADO: { bg: 'rgba(249,115,22,0.2)', color: '#f97316' },
  EN_CAMINO: { bg: 'rgba(249,115,22,0.3)', color: '#f97316' },
  ENTREGADO: { bg: 'rgba(0,200,150,0.2)', color: '#00C896' },
  CANCELADO: { bg: 'rgba(239,68,68,0.2)', color: '#ef4444' }
}

function TimelineEstado({ estados, estadoActual }) {
  const estadoOrden = ['PENDIENTE', 'EN_PREPARACION', 'ENVIADO', 'EN_CAMINO', 'ENTREGADO']
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
      {estadoOrden.map((estado, idx) => {
        const idxActual = estadoOrden.indexOf(estadoActual)
        const completado = idx <= idxActual
        const actual = idx === idxActual
        
        return (
          <div key={estado} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: completado ? ESTADOS_COLORES[estado]?.color || '#00C896' : 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: actual ? '2px solid #fff' : 'none',
                transition: 'all 0.3s'
              }}
            >
              {completado && <CheckCircle size={14} color="#fff" />}
            </div>
            {idx < estadoOrden.length - 1 && (
              <div style={{
                flex: 1,
                height: 2,
                background: idx < idxActual ? ESTADOS_COLORES[estado]?.color : 'rgba(255,255,255,0.1)',
                margin: '0 4px'
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ProfilePedidosSection() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [detallePedido, setDetallePedido] = useState(null)

  useEffect(() => {
    profileService.getPedidos()
      .then(res => setPedidos(res.data || []))
      .catch(() => toast.error('Error al cargar pedidos'))
      .finally(() => setLoading(false))
  }, [])

  const pedidosFiltrados = pedidos.filter(p => {
    const coincideFiltro = filtro === 'todos' || p.estado === filtro
    const coincideBusqueda = !busqueda || p.id.toString().includes(busqueda)
    return coincideFiltro && coincideBusqueda
  })

  const getNombreCorto = (productos) => {
    if (!productos?.length) return 'Sin productos'
    if (productos.length === 1) return productos[0].nombre
    return `${productos[0].nombre} + ${productos.length - 1} más`
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return ''
    return new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
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
        📦 Mis pedidos
      </h3>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
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
            placeholder="Buscar pedido #..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(30,30,30,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem 0.75rem 2.5rem',
              color: 'var(--color-text)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>
        
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{
            background: 'rgba(30,30,30,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            color: 'var(--color-text)',
            fontSize: '0.9rem',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="todos">Todos</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PREPARACION">En preparación</option>
          <option value="ENVIADO">Enviado</option>
          <option value="EN_CAMINO">En camino</option>
          <option value="ENTREGADO">Entregado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <Package size={48} color="var(--color-text-faint)" />
          <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>No tienes pedidos</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pedidosFiltrados.map((pedido) => {
            const estadoColor = ESTADOS_COLORES[pedido.estado] || ESTADOS_COLORES.PENDIENTE
            
            return (
              <motion.div
                key={pedido.id}
                whileHover={{ y: -2 }}
                style={{
                  background: 'rgba(30,30,30,0.8)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  cursor: 'pointer'
                }}
                onClick={() => setDetallePedido(pedido)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>#{pedido.id}</span>
                    <p style={{ color: 'var(--color-text)', fontWeight: 600, margin: '0.25rem 0 0' }}>
                      {getNombreCorto(pedido.productos)}
                    </p>
                  </div>
                  <span style={{
                    background: estadoColor.bg,
                    color: estadoColor.color,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {pedido.estado?.replace('_', ' ')}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    ${(pedido.total || 0).toLocaleString('es-CO')}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    {pedido.guia && <><Truck size={14} /> Guía: {pedido.guia}</>}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {detallePedido && (
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
            onClick={() => setDetallePedido(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#1a1a1a',
                borderRadius: '1rem',
                padding: '1.5rem',
                maxWidth: 500,
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--color-text)', margin: 0 }}>Pedido #{detallePedido.id}</h3>
                <button
                  onClick={() => setDetallePedido(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>Productos</h4>
                  {detallePedido.productos?.map((prod, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {prod.imagen && (
                        <img src={prod.imagen} alt={prod.nombre} style={{ width: 50, height: 50, borderRadius: '0.25rem', objectFit: 'cover' }} />
                      )}
                      <div>
                        <p style={{ color: 'var(--color-text)', margin: 0, fontSize: '0.9rem' }}>{prod.nombre}</p>
                        <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0', fontSize: '0.8rem' }}>
                          {prod.cantidad} x ${(prod.precio || 0).toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {detallePedido.direccion && (
                  <div>
                    <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={14} /> Dirección de envío
                    </h4>
                    <p style={{ color: 'var(--color-text)', margin: 0, fontSize: '0.9rem' }}>{detallePedido.direccion}</p>
                  </div>
                )}

                <div>
                  <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>Resumen de pago</h4>
                  <div style={{ background: 'rgba(30,30,30,0.8)', borderRadius: '0.5rem', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
                      <span style={{ color: 'var(--color-text)' }}>${(detallePedido.subtotal || 0).toLocaleString('es-CO')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Envío</span>
                      <span style={{ color: 'var(--color-text)' }}>${(detallePedido.envio || 0).toLocaleString('es-CO')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                      <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>Total</span>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>${(detallePedido.total || 0).toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                </div>

                {detallePedido.estado && (
                  <div>
                    <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: '0 0 0.75rem' }}>Seguimiento</h4>
                    <TimelineEstado estados={[]} estadoActual={detallePedido.estado} />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}