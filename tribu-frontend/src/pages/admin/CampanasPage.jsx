import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Plus, Edit, Trash2, ToggleLeft, ToggleRight, 
  BarChart3, Users, Mail, Send, X, Ticket, FileText, 
  Download, Eye, Percent, DollarSign, Calendar, Search, 
  AlertCircle, CheckCircle2, Clock
} from 'lucide-react'
import { campanasService } from '../../services/services'
import { 
  getAdminCupones, crearAdminCupon, actualizarAdminCupon, 
  eliminarAdminCupon, getAdminFacturas, descargarFacturaPdf 
} from '../../api'
import { formatCOP, formatFecha } from '../../utils/formatters'
import Skeleton from '../../components/Skeleton'
import { getTiers } from '../../api'
import toast from 'react-hot-toast'

export default function CampanasPage() {
  const [tab, setTab] = useState('cashback')
  const [campanas, setCampanas] = useState([])
  const [cupones, setCupones] = useState([])
  const [facturas, setFacturas] = useState([])
  const [segmentos, setSegmentos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [tiers, setTiers] = useState([])
  
  const [nuevaCampana, setNuevaCampana] = useState({
    nombre: '',
    descripcion: '',
    multiplicador: 2,
    tiers: ['BRONCE', 'PLATA', 'ORO'],
    fechaInicio: '',
    fechaFin: '',
    limiteUsos: null
  })

  const [marketingCampana, setMarketingCampana] = useState({
    titulo: '',
    cuerpo: '',
    tipo: 'AMBOS',
    segmento: 'TODOS',
    fechaProgramada: ''
  })

  const [nuevoCupon, setNuevoCupon] = useState({
    codigo: '',
    descripcion: '',
    tipo: 'PORCENTAJE',
    valor: '',
    compraMinima: '',
    fechaExpiracion: '',
    limiteUsos: '',
    activo: true
  })

  useEffect(() => {
    fetchData()
  }, [tab])

  useEffect(() => {
    loadTiers()
  }, [])

  const loadTiers = async () => {
    try {
      const res = await getTiers()
      setTiers(res.data)
    } catch (err) {
      console.error("Error loading tiers:", err)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      if (tab === 'cashback') {
        const res = await campanasService.todas()
        setCampanas(Array.isArray(res.data) ? res.data : [])
      } else if (tab === 'marketing') {
        const [seg, camp] = await Promise.all([
          campanasService.segmentosConteo().catch(() => ({ data: null })),
          campanasService.campanasMarketing().catch(() => ({ data: [] }))
        ])
        setSegmentos(seg.data)
        setCampanas(Array.isArray(camp.data) ? camp.data : [])
      } else if (tab === 'cupones') {
        const res = await getAdminCupones()
        setCupones(res.data)
      } else if (tab === 'facturas') {
        const res = await getAdminFacturas()
        setFacturas(res.data)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleActivarCampana = async (id) => {
    try {
      await campanasService.activar(id)
      fetchData()
    } catch (err) {
      toast.error('Error al activar campaña')
    }
  }

  const handleCrearCampana = async () => {
    try {
      if (tab === 'cashback') {
        const tierIds = nuevaCampana.tiers.map(tName => {
          const t = tiers.find(th => th.nombre === tName)
          return t ? t.id : null
        }).filter(id => id !== null)

        const payload = {
          ...nuevaCampana,
          fechaInicio: nuevaCampana.fechaInicio ? `${nuevaCampana.fechaInicio}T00:00:00` : null,
          fechaFin: nuevaCampana.fechaFin ? `${nuevaCampana.fechaFin}T23:59:59` : null,
          tiersAplicablesIds: tierIds
        }
        await campanasService.crear(payload)
      } else {
        const payload = {
          ...marketingCampana,
          fechaProgramada: marketingCampana.fechaProgramada ? `${marketingCampana.fechaProgramada.replace(' ', 'T')}:00` : null
        }
        await campanasService.crearCampanaMarketing(payload)
      }
      
      setShowModal(false)
      toast.success('Campaña creada satisfactoriamente')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al crear campaña')
    }
  }

  const handleCrearCupon = async () => {
    try {
      const payload = {
        ...nuevoCupon,
        valor: Number(nuevoCupon.valor),
        compraMinima: Number(nuevoCupon.compraMinima),
        limiteUsos: nuevoCupon.limiteUsos ? Number(nuevoCupon.limiteUsos) : null,
        fechaExpiracion: nuevoCupon.fechaExpiracion ? `${nuevoCupon.fechaExpiracion}T23:59:59` : null
      }
      await crearAdminCupon(payload)
      setShowCouponModal(false)
      toast.success('Cupón creado ✓')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al crear cupón')
    }
  }

  const handleToggleCupon = async (cupon) => {
    try {
      await actualizarAdminCupon(cupon.id, { ...cupon, activo: !cupon.activo })
      toast.success(cupon.activo ? 'Cupón desactivado' : 'Cupón activado')
      fetchData()
    } catch (err) {
      toast.error('Error al actualizar cupón')
    }
  }

  const handleEliminarCupon = async (id) => {
    if (!window.confirm('¿Eliminar este cupón permanentemente?')) return
    try {
      await eliminarAdminCupon(id)
      toast.success('Cupón eliminado')
      fetchData()
    } catch (err) {
      toast.error('Error al eliminar cupón')
    }
  }

  const handleDescargarFactura = async (id, numero) => {
    try {
      const res = await descargarFacturaPdf(id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Factura_${numero}.pdf`)
      document.body.appendChild(link)
      link.click()
    } catch (err) {
      toast.error('Error al descargar factura')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background, #0a0a0a)', paddingTop: '5.5rem', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Header Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Zap size={32} color="#ff5722" fill="#ff5722" />
              Marketing Hub
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              Gestión de fidelización, cupones y facturación electrónica
            </p>
          </div>
          
          {(tab === 'cashback' || tab === 'marketing' || tab === 'cupones') && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => tab === 'cupones' ? setShowCouponModal(true) : setShowModal(true)}
              style={{ padding: '0.7rem 1.2rem', background: '#ff5722', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 15px rgba(255,87,34,0.3)' }}
            >
              <Plus size={20} />
              {tab === 'cupones' ? 'Nuevo Cupón' : `Nueva ${tab === 'cashback' ? 'Campaña' : 'Marketing'}`}
            </motion.button>
          )}
        </div>

        {/* Tab Navigator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { id: 'cashback', label: 'Cashback', icon: Zap },
            { id: 'marketing', label: 'Marketing', icon: Mail },
            { id: 'cupones', label: 'Cupones', icon: Ticket },
            { id: 'facturas', label: 'Facturas', icon: FileText },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: tab === t.id ? 'var(--color-primary)' : 'transparent',
                color: tab === t.id ? '#fff' : '#aaa',
                border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <t.icon size={18} />
              <span className="hide-mobile">{t.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} h={100} r={16} />)}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            
            {/* ── SECCIÓN: CASHBACK / MARKETING ── */}
            {(tab === 'cashback' || tab === 'marketing') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tab === 'marketing' && segmentos && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: '1.25rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: 1 }}>Segmentación de Audiencia</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                      {Object.entries(segmentos).map(([k, v]) => (
                        <div key={k} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 700 }}>{k.replace(/_/g, ' ')}</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{v} <span style={{ fontSize: '0.8rem', color: '#444' }}>usu.</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {campanas.length === 0 ? (
                  <div className="card" style={{ padding: '4rem', textAlign: 'center', color: '#444' }}>
                    <Zap size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                    <p>No hay campañas activas en este momento</p>
                  </div>
                ) : campanas.map((c, idx) => (
                  <div key={c.id} className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: 50, height: 50, borderRadius: 14, background: tab === 'cashback' ? 'rgba(255,87,34,0.1)' : 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                      {tab === 'cashback' ? '⚡' : '📢'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{c.nombre || c.titulo}</h3>
                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 6, background: c.activa || c.estado === 'ACTIVA' ? 'rgba(0,200,150,0.1)' : '#222', color: c.activa || c.estado === 'ACTIVA' ? '#00C896' : '#666', fontWeight: 800 }}>{c.estado || (c.activa ? 'ACTIVA' : 'INACTIVA')}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#aaa', lineHeight: 1.4 }}>{c.descripcion || c.cuerpo}</p>
                      <div style={{ display: 'flex', gap: 15, marginTop: 10, fontSize: '0.78rem', color: '#555' }}>
                        {tab === 'cashback' ? (
                          <>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12}/> {formatFecha(c.fechaInicio)} - {formatFecha(c.fechaFin)}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12}/> {c.usosActuales} / {c.limiteUsoTotal || '∞'}</span>
                            <span style={{ color: '#ff5722', fontWeight: 800 }}>Multiplicador: {c.multiplicador}x</span>
                          </>
                        ) : (
                          <>
                            <span style={{ color: '#fff' }}>Canal: {c.tipo}</span>
                            <span>Destino: {c.segmento}</span>
                            {c.fechaProgramada && <span>Programado: {formatFecha(c.fechaProgramada)}</span>}
                          </>
                        )}
                      </div>
                    </div>
                    {tab === 'cashback' && !c.activa && (
                      <button onClick={() => handleActivarCampana(c.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Activar</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── SECCIÓN: CUPONES ── */}
            {tab === 'cupones' && (
              <div className="table-wrap" style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Código</th><th>Descripción</th><th>Tipo</th><th>Valor</th><th>Mín. Compra</th><th>Usos</th><th>Estado</th><th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cupones.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#444' }}>No hay cupones creados</td></tr>
                    ) : cupones.map(cp => (
                      <tr key={cp.id}>
                        <td><div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--color-primary)', letterSpacing: 0.5 }}>{cp.codigo}</div></td>
                        <td style={{ fontSize: '0.85rem', color: '#888', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{cp.descripcion || '—'}</td>
                        <td><span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>{cp.tipo}</span></td>
                        <td style={{ fontWeight: 800 }}>{cp.tipo === 'PORCENTAJE' ? `${cp.valor}%` : formatCOP(cp.valor)}</td>
                        <td style={{ color: '#666' }}>{formatCOP(cp.compraMinima)}</td>
                        <td>{cp.usosActuales || 0} / {cp.limiteUsos || '∞'}</td>
                        <td>
                          <button onClick={() => handleToggleCupon(cp)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            {cp.activo ? <ToggleRight color="#00C896" size={28} /> : <ToggleLeft color="#444" size={28} />}
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button onClick={() => handleEliminarCupon(cp.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: 8, borderRadius: 8, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── SECCIÓN: FACTURAS ── */}
            {tab === 'facturas' && (
              <div className="table-wrap" style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Factura #</th><th>Fecha</th><th>Cliente</th><th>NIT / Razón Social</th><th>Total</th><th>Estado</th><th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturas.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#444' }}>No hay facturas solicitadas</td></tr>
                    ) : facturas.map(f => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 700 }}>{f.numeroFactura}</td>
                        <td style={{ fontSize: '0.82rem', color: '#888' }}>{formatFecha(f.fechaEmision)}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.usuario?.nombreCompleto}</div>
                          <div style={{ fontSize: '0.75rem', color: '#555' }}>{f.usuario?.email}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>{f.razonSocial}</div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>{f.nit}</div>
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{formatCOP(f.total)}</td>
                        <td>
                          <span style={{ 
                            fontSize: '0.7rem', padding: '4px 10px', borderRadius: 20, fontWeight: 800,
                            background: f.estado === 'ENVIADA' ? 'rgba(0,200,150,0.1)' : 'rgba(59,130,246,0.1)',
                            color: f.estado === 'ENVIADA' ? '#00C896' : '#3b82f6'
                          }}>{f.estado}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => handleDescargarFactura(f.id, f.numeroFactura)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: 10, borderRadius: 10, color: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            <Download size={18}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ── MODAL: NUEVA CAMPAÑA ── */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 500, padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ margin: 0, fontWeight: 900 }}>Nueva {tab === 'cashback' ? 'Campaña' : 'Marketing'}</h2>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24}/></button>
                </div>

                {tab === 'cashback' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Nombre de la campaña</label>
                      <input className="input" placeholder="Ej: Super Fin de Semana" value={nuevaCampana.nombre} onChange={e => setNuevaCampana({...nuevaCampana, nombre: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Multiplicador de Cashback</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <input type="range" min="1.5" max="5" step="0.5" style={{ flex: 1, accentColor: '#ff5722' }} value={nuevaCampana.multiplicador} onChange={e => setNuevaCampana({...nuevaCampana, multiplicador: Number(e.target.value)})} />
                        <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#ff5722', width: 40 }}>{nuevaCampana.multiplicador}x</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group">
                        <label>Fecha Inicio</label>
                        <input type="date" className="input" value={nuevaCampana.fechaInicio} onChange={e => setNuevaCampana({...nuevaCampana, fechaInicio: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Fecha Fin</label>
                        <input type="date" className="input" value={nuevaCampana.fechaFin} onChange={e => setNuevaCampana({...nuevaCampana, fechaFin: e.target.value})} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Título del mensaje</label>
                      <input className="input" placeholder="¡No te pierdas esto!" value={marketingCampana.titulo} onChange={e => setMarketingCampana({...marketingCampana, titulo: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Contenido</label>
                      <textarea className="input" rows={3} placeholder="Describe el beneficio..." value={marketingCampana.cuerpo} onChange={e => setMarketingCampana({...marketingCampana, cuerpo: e.target.value})} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group">
                        <label>Canal</label>
                        <select className="input" value={marketingCampana.tipo} onChange={e => setMarketingCampana({...marketingCampana, tipo: e.target.value})}>
                          <option value="EMAIL">Email</option>
                          <option value="PUSH">Push Notification</option>
                          <option value="AMBOS">Ambos</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Target Segmento</label>
                        <select className="input" value={marketingCampana.segmento} onChange={e => setMarketingCampana({...marketingCampana, segmento: e.target.value})}>
                          <option value="TODOS">Todos</option>
                          <option value="TIER_ORO">Tier Oro</option>
                          <option value="SIN_COMPRA_30_DIAS">Inactivos 30d</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={handleCrearCampana} className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', height: 50, fontWeight: 900, borderRadius: 14 }}>Guardar y Publicar</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MODAL: NUEVO CUPÓN ── */}
        <AnimatePresence>
          {showCouponModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCouponModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 480, padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ margin: 0, fontWeight: 900 }}>Crear Cupón</h2>
                  <button onClick={() => setShowCouponModal(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24}/></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label>Código del Cupón</label>
                    <input className="input" style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontSize: '1.2rem', textAlign: 'center' }} placeholder="BIENVENIDA20" value={nuevoCupon.codigo} onChange={e => setNuevoCupon({...nuevoCupon, codigo: e.target.value.toUpperCase()})} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label>Tipo</label>
                      <select className="input" value={nuevoCupon.tipo} onChange={e => setNuevoCupon({...nuevoCupon, tipo: e.target.value})}>
                        <option value="PORCENTAJE">Porcentaje (%)</option>
                        <option value="FIJO">Monto Fijo (COP)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Valor</label>
                      <input type="number" className="input" placeholder={nuevoCupon.tipo === 'PORCENTAJE' ? "15" : "10000"} value={nuevoCupon.valor} onChange={e => setNuevoCupon({...nuevoCupon, valor: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Mínimo de Compra</label>
                    <input type="number" className="input" placeholder="0" value={nuevoCupon.compraMinima} onChange={e => setNuevoCupon({...nuevoCupon, compraMinima: e.target.value})} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label>Límite de Usos</label>
                      <input type="number" className="input" placeholder="Ej: 100" value={nuevoCupon.limiteUsos} onChange={e => setNuevoCupon({...nuevoCupon, limiteUsos: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Expira</label>
                      <input type="date" className="input" value={nuevoCupon.fechaExpiracion} onChange={e => setNuevoCupon({...nuevoCupon, fechaExpiracion: e.target.value})} />
                    </div>
                  </div>
                </div>

                <button onClick={handleCrearCupon} className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', height: 50, fontWeight: 900, borderRadius: 14 }}>Generar Cupón ✓</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
