import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, CheckCircle, Download, Search, Edit2, Save, X, Filter } from 'lucide-react'
import { api } from '../../api'
import { formatCOP } from '../../utils/formatters'
import Skeleton from '../../components/Skeleton'

export default function InventarioPage() {
  const [productos, setProductos] = useState([])
  const [stats, setStats] = useState({ critico: 0, bajo: 0, normal: 0 })
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState(null)
  const [editStock, setEditStock] = useState('')
  const [editUmbrales, setEditUmbrales] = useState({ minimo: 5, critico: 3 })
  const [showUmbrales, setShowUmbrales] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/productos')
      const prods = res.data || []
      setProductos(prods)
      
      const critico = prods.filter(p => p.stock <= (p.umbralCritico || 3)).length
      const bajo = prods.filter(p => p.stock > (p.umbralCritico || 3) && p.stock <= (p.umbralMinimo || 10)).length
      const normal = prods.length - critico - bajo
      setStats({ critico, bajo, normal })
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveStock = async (id) => {
    try {
      await api.put(`/productos/${id}/stock`, { stock: parseInt(editStock) })
      setEditando(null)
      fetchData()
    } catch (err) {
      alert('Error al guardar stock')
    }
  }

  const handleSaveUmbrales = async (id) => {
    try {
      await api.put(`/productos/${id}/umbrales`, editUmbrales)
      setShowUmbrales(null)
      fetchData()
    } catch (err) {
      alert('Error al guardar umbrales')
    }
  }

  const filtered = productos.filter(p => {
    const coincideBusqueda = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    if (filtro === 'todos') return coincideBusqueda
    if (filtro === 'critico') return coincideBusqueda && p.stock <= (p.umbralCritico || 3)
    if (filtro === 'bajo') return coincideBusqueda && p.stock > (p.umbralCritico || 3) && p.stock <= (p.umbralMinimo || 10)
    if (filtro === 'normal') return coincideBusqueda && p.stock > (p.umbralMinimo || 10)
    return coincideBusqueda
  })

  const getStockStatus = (p) => {
    if (p.stock <= (p.umbralCritico || 3)) return 'critico'
    if (p.stock <= (p.umbralMinimo || 10)) return 'bajo'
    return 'normal'
  }

  const getStatusColor = (status) => {
    if (status === 'critico') return { bg: '#E24B4A20', text: '#E24B4A', border: '#E24B4A40' }
    if (status === 'bajo') return { bg: '#FFB84D20', text: '#FFB84D', border: '#FFB84D40' }
    return { bg: '#1D9E7520', text: '#1D9E75', border: '#1D9E7540' }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background, #0a0a0a)',
      paddingTop: '5rem',
      paddingBottom: '2rem'
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 1rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={28} color="#ff5722" />
            Inventario
          </h1>
          <motion.button
            whileHover={{ scale: 1.02 }}
            style={{
              padding: '0.5rem 1rem',
              background: '#2a2a2a',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Download size={16} />
            Exportar CSV
          </motion.button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem' }}>
          {[
            { id: 'todos', label: 'Todos', count: productos.length, color: '#fff' },
            { id: 'critico', label: 'Crítico', count: stats.critico, color: '#E24B4A' },
            { id: 'bajo', label: 'Stock bajo', count: stats.bajo, color: '#FFB84D' },
            { id: 'normal', label: 'Normal', count: stats.normal, color: '#1D9E75' }
          ].map(f => (
            <motion.button
              key={f.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFiltro(f.id)}
              style={{
                padding: '0.75rem 1rem',
                background: filtro === f.id ? `${f.color}20` : 'var(--color-background-primary, #1a1a1a)',
                border: `1px solid ${filtro === f.id ? f.color : '#333'}`,
                borderRadius: 10,
                color: filtro === f.id ? f.color : '#888',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              {f.id === 'critico' && <AlertTriangle size={14} />}
              {f.id === 'normal' && <CheckCircle size={14} />}
              {f.label}
              <span style={{
                padding: '2px 6px',
                borderRadius: 4,
                background: filtro === f.id ? f.color : '#333',
                color: filtro === f.id ? '#000' : '#888',
                fontSize: '0.75rem'
              }}>
                {f.count}
              </span>
            </motion.button>
          ))}
        </div>

        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.5rem',
              background: 'var(--color-background-primary, #1a1a1a)',
              border: '1px solid #333',
              borderRadius: 10,
              color: '#fff',
              outline: 'none'
            }}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3,4,5].map(i => <Skeleton key={i} h={60} r={12} />)}
          </div>
        ) : (
          <div style={{
            background: 'var(--color-background-primary, #1a1a1a)',
            borderRadius: 16,
            overflow: 'hidden',
            border: '0.5px solid #333'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#666', fontSize: '0.8rem', fontWeight: 600 }}>Producto</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#666', fontSize: '0.8rem', fontWeight: 600 }}>Stock</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#666', fontSize: '0.8rem', fontWeight: 600 }}>Umbral Mín</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#666', fontSize: '0.8rem', fontWeight: 600 }}>Umbral Crít</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#666', fontSize: '0.8rem', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#666', fontSize: '0.8rem', fontWeight: 600 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => {
                  const status = getStockStatus(p)
                  const colors = getStatusColor(status)
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      style={{ 
                        borderBottom: '0.5px solid #2a2a2a',
                        background: status === 'critico' ? '#E24B4A10' : status === 'bajo' ? '#FFB84D10' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {p.imagenUrl ? (
                            <img src={p.imagenUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Package size={20} color="#666" />
                            </div>
                          )}
                          <span style={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>{p.nombre}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        {editando === p.id ? (
                          <input
                            type="number"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            autoFocus
                            style={{
                              width: 60,
                              padding: '4px 8px',
                              background: '#2a2a2a',
                              border: '1px solid #ff5722',
                              borderRadius: 4,
                              color: '#fff',
                              textAlign: 'center',
                              outline: 'none'
                            }}
                          />
                        ) : (
                          <span style={{ color: colors.text, fontWeight: 700, fontSize: '1rem' }}>{p.stock}</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>
                        {p.umbralMinimo || 10}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>
                        {p.umbralCritico || 3}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`
                        }}>
                          {status === 'critico' ? 'Crítico' : status === 'bajo' ? 'Bajo' : 'Normal'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          {editando === p.id ? (
                            <>
                              <button
                                onClick={() => handleSaveStock(p.id)}
                                style={{ padding: '4px 8px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                              >
                                <Save size={14} />
                              </button>
                              <button
                                onClick={() => setEditando(null)}
                                style={{ padding: '4px 8px', background: '#333', color: '#888', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setEditando(p.id); setEditStock(p.stock.toString()) }}
                                style={{ padding: '4px 8px', background: '#2a2a2a', color: '#888', border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => { setShowUmbrales(p); setEditUmbrales({ minimo: p.umbralMinimo || 10, critico: p.umbralCritico || 3 }) }}
                                style={{ padding: '4px 8px', background: '#2a2a2a', color: '#888', border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }}
                              >
                                <Filter size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {showUmbrales && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              style={{
                background: '#1a1a1a',
                borderRadius: 16,
                padding: '1.5rem',
                width: '90%',
                maxWidth: 400
              }}
            >
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>{showUmbrales.nombre}</h3>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>Stock actual: {showUmbrales.stock} unidades</p>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Umbral mínimo</label>
                <input
                  type="number"
                  value={editUmbrales.minimo}
                  onChange={(e) => setEditUmbrales({ ...editUmbrales, minimo: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: 8,
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Umbral crítico</label>
                <input
                  type="number"
                  value={editUmbrales.critico}
                  onChange={(e) => setEditUmbrales({ ...editUmbrales, critico: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: 8,
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowUmbrales(null)}
                  style={{ flex: 1, padding: '0.75rem', background: '#333', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSaveUmbrales(showUmbrales.id)}
                  style={{ flex: 1, padding: '0.75rem', background: '#ff5722', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
