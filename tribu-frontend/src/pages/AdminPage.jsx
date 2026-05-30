import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    getAllPedidos, actualizarEstadoPedido,
    getUsuarios, promoverAdmin, asignarCliente,
    getTodasLasNotas, crearNota,
    getStockBajo, getCategorias,
    crearProducto, actualizarProducto, eliminarProducto,
    crearCategoria, actualizarCategoria, eliminarCategoria,
    getTodasLasDevoluciones, actualizarEstadoDevolucion, reembolsarSaldoDevolucion,
    getEstadisticasDevolucion, getSeguridadAccesos,
    adminGetMovimientosTribuCard, adminGetTribuCardResumen,
    adminGetTransferencias,
    getAdminFacturas, adminActualizarDatosFactura,
    adminGetConversacionesSoporte,
    adminGetMensajesSoporte,
    adminEnviarMensajeSoporte,
    adminResolverConversacionSoporte,
    getAdminGirosRuleta,
    getAdminRuletaConfig,
    saveAdminRuletaConfig
} from '../api'
import toast from 'react-hot-toast'
import {
    Package, Users, FileText, AlertTriangle, Plus, X,
    Check, ShoppingBag, Pencil, Trash2, Image, BarChart3,
    TrendingUp, TrendingDown, User, Zap, Tag, RotateCcw, ShieldAlert,
    Activity, Sparkles, ArrowUpRight, Search, RefreshCw, WalletCards, ArrowDownRight, ArrowRightLeft,
    MessageSquare, Bot, RotateCw, Gift, Phone, Mail
} from 'lucide-react'
import { useAdminMonitoringWebSocket } from '../hooks/useAdminMonitoringWebSocket'

const ESTADOS = ['PENDIENTE', 'PAGADO', 'ENVIADO', 'ENTREGADO']
const estadoColor = {
    PENDIENTE: 'badge-pendiente', PAGADO: 'badge-cliente',
    ENVIADO: 'badge-enviado', ENTREGADO: 'badge-entregado'
}
const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

// ─── Modal de Producto ─────────────────────────────────────────────────────────
const PRODUCTO_VACIO = { nombre: '', descripcion: '', precio: '', stock: '', esViral: false, categoriaId: '', imagenUrl: '', costoProveedor: '', costoEmpaqueEnvio: '', comisionPasarelaFija: '' }

function ModalProducto({ prod, categorias, onClose, onSave }) {
    const [form, setForm] = useState(prod || PRODUCTO_VACIO)
    const [loading, setLoading] = useState(false)

    const set = (k) => (e) => setForm(f => ({
        ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const payload = {
                ...form,
                precio: Number(form.precio),
                stock: Number(form.stock),
                categoriaId: Number(form.categoriaId),
                costoProveedor: Number(form.costoProveedor || 0),
                costoEmpaqueEnvio: Number(form.costoEmpaqueEnvio || 0),
                comisionPasarelaFija: Number(form.comisionPasarelaFija || 0)
            }
            if (prod?.id) {
                await actualizarProducto(prod.id, payload)
                toast.success('Producto actualizado ✅')
            } else {
                await crearProducto(payload)
                toast.success('Producto creado 🎉')
            }
            onSave()
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.mensaje || 'Error al guardar')
        } finally { setLoading(false) }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}
        >
            <motion.div
                initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                onClick={e => e.stopPropagation()}
                className="card" style={{ width: '100%', maxWidth: 520, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {prod?.id ? <><Pencil size={17} /> Editar Producto</> : <><Plus size={17} /> Nuevo Producto</>}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre del producto</label>
                        <input className="input" value={form.nombre} onChange={set('nombre')} required placeholder="Ej: Gadget magnético viral" />
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea className="input" rows={5} value={form.descripcion} onChange={set('descripcion')}
                            maxLength={5000}
                            placeholder="Describe el producto..." style={{ resize: 'vertical', minHeight: '120px' }} />
                        <span style={{ fontSize: '0.75rem', color: (form.descripcion?.length || 0) > 4500 ? 'var(--color-primary)' : 'var(--color-text-faint)', display: 'block', textAlign: 'right', marginTop: '3px' }}>
                            {form.descripcion?.length || 0} / 5000
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Precio (COP)</label>
                            <input className="input" type="number" min="0" value={form.precio} onChange={set('precio')} required placeholder="49900" />
                        </div>
                        <div className="form-group">
                            <label>Stock</label>
                            <input className="input" type="number" min="0" value={form.stock} onChange={set('stock')} required placeholder="50" />
                        </div>
                    </div>
                    <div className="form-group">
                                            <div style={{ padding: '1.2rem', border: '1px solid rgba(255,87,34,0.15)', borderRadius: 12, background: 'rgba(255,87,34,0.02)', marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <TrendingUp size={13} /> Finanzas Administrativas
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.72rem', color: '#8b8b8b' }}>Costo Prov.</label>
                                <input className="input" type="number" min="0" value={form.costoProveedor || ''} onChange={set('costoProveedor')} placeholder="0" style={{ padding: '6px 10px', fontSize: '0.85rem' }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.72rem', color: '#8b8b8b' }}>Costo Envío</label>
                                <input className="input" type="number" min="0" value={form.costoEmpaqueEnvio || ''} onChange={set('costoEmpaqueEnvio')} placeholder="0" style={{ padding: '6px 10px', fontSize: '0.85rem' }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.72rem', color: '#8b8b8b' }}>Comisión Pas.</label>
                                <input className="input" type="number" min="0" value={form.comisionPasarelaFija || ''} onChange={set('comisionPasarelaFija')} placeholder="0" style={{ padding: '6px 10px', fontSize: '0.85rem' }} />
                            </div>
                        </div>
                    </div>

                        <label>Categoría</label>
                        <select className="input" value={form.categoriaId} onChange={set('categoriaId')} required>
                            <option value="">Seleccionar categoría...</option>
                            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Image size={13} /> URL de imagen
                        </label>
                        <input className="input" value={form.imagenUrl} onChange={set('imagenUrl')} placeholder="https://... o /uploads/uuid.jpg" />
                        {form.imagenUrl && (
                            <div style={{ marginTop: '0.5rem', borderRadius: '8px', overflow: 'hidden', height: 80, background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src={form.imagenUrl} alt="preview" style={{ height: '100%', objectFit: 'cover', width: '100%' }}
                                    onError={e => e.target.style.display = 'none'} />
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <input type="checkbox" id="viral" checked={form.esViral} onChange={set('esViral')}
                            style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
                        <label htmlFor="viral" style={{ cursor: 'pointer', marginBottom: 0, color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Zap size={14} color="var(--color-primary)" /> Marcar como VIRAL
                        </label>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        type="submit" className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', fontWeight: 800 }}
                        disabled={loading}>
                        {loading ? '⏳ Guardando...' : prod?.id ? 'Actualizar Producto' : 'Crear Producto'}
                    </motion.button>
                </form>
            </motion.div>
        </motion.div>
    )
}

// ─── AdminPage Principal ───────────────────────────────────────────────────────
export default function AdminPage() {
    const [tab, setTab] = useState('productos')
    const [pedidos, setPedidos] = useState([])
    const [usuarios, setUsuarios] = useState([])
    const [facturas, setFacturas] = useState([])
    const [notas, setNotas] = useState([])
    const [stockBajo, setStockBajo] = useState([])
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [devoluciones, setDevoluciones] = useState([])
    const [statsDevoluciones, setStatsDevoluciones] = useState(null)
    const [accesos, setAccesos] = useState([])
    const [loading, setLoading] = useState(true)

    // Ruleta Estados
    const [girosRuleta, setGirosRuleta] = useState([])
    const [productoRegalo, setProductoRegalo] = useState('')
    const [loadingConfig, setLoadingConfig] = useState(false)
    const [savingConfig, setSavingConfig] = useState(false)

    const [viewMode, setViewMode] = useState('overview')

    // Filtros (modo Operaciones)
    const [opsFilters, setOpsFilters] = useState({
        q: '',
        pedidosEstado: '',
        devolucionesEstado: '',
        usuariosRol: '',
        productosCategoriaId: ''
    })

    // Tribu Card (Admin)
    const [tribuCardResumen, setTribuCardResumen] = useState(null)
    const [tribuCardMovs, setTribuCardMovs] = useState({ items: [], page: 0, size: 25, totalPages: 0, totalElements: 0 })
    const [tribuCardLoading, setTribuCardLoading] = useState(false)
    const [tribuCardErr, setTribuCardErr] = useState('')
    const [tribuCardFilters, setTribuCardFilters] = useState({ q: '', estado: '', tipo: '', page: 0, size: 25 })
    const tribuCardFiltersRef = useRef(tribuCardFilters)
    const tribuCardLastSeenMsRef = useRef(0)
    const [tribuCardWatching, setTribuCardWatching] = useState(false)
    const [tribuCardWatchEverySec, setTribuCardWatchEverySec] = useState(10)
    const [tribuCardLastUpdatedAt, setTribuCardLastUpdatedAt] = useState('')
    const [tribuCardNewCount, setTribuCardNewCount] = useState(0)
    const [tribuCardHighlightAfterMs, setTribuCardHighlightAfterMs] = useState(0)
    const [tribuCardWsConnected, setTribuCardWsConnected] = useState(false)

    // Soporte Live Chat Admin
    const [soporteChats, setSoporteChats] = useState([])
    const [soporteChatActivo, setSoporteChatActivo] = useState(null)
    const [soporteMensajes, setSoporteMensajes] = useState([])
    const [soporteNuevoMensaje, setSoporteNuevoMensaje] = useState('')
    const [soporteCargandoChat, setSoporteCargandoChat] = useState(false)
    const [soporteEnviando, setSoporteEnviando] = useState(false)
    const [soporteFiltroQ, setSoporteFiltroQ] = useState('')
    const soporteMessagesEndRef = useRef(null)

    // Transferencias P2P (Admin)
    const [transferencias, setTransferencias] = useState({ items: [], page: 0, size: 25, totalPages: 0, totalElements: 0 })
    const [transferenciasLoading, setTransferenciasLoading] = useState(false)
    const [transferenciasErr, setTransferenciasErr] = useState('')
    const [transferenciasFilters, setTransferenciasFilters] = useState({ q: '', estado: '', page: 0, size: 25 })
    const [transferenciasWsConnected, setTransferenciasWsConnected] = useState(false)

    const token = localStorage.getItem('tribu_token')

    const { connected: adminWsConnected } = useAdminMonitoringWebSocket({
        enabled: viewMode === 'operaciones' && (tab === 'tribuCard' || tab === 'transferencias') && !!token,
        token,
        onMovimiento: (m) => {
            // Only apply when we're in Tribu Card view to avoid surprising UI updates.
            if (!(viewMode === 'operaciones' && tab === 'tribuCard')) return

            const f = tribuCardFiltersRef.current || tribuCardFilters
            if (Number(f.page || 0) !== 0) return

            if (f.estado && String(m?.estado || '') !== String(f.estado)) return
            if (f.tipo && String(m?.tipo || '') !== String(f.tipo)) return
            if (f.q) {
                const q = String(f.q).toLowerCase().trim()
                const hay = [
                    m?.id,
                    m?.pedidoId,
                    m?.descripcion,
                    m?.usuarioNombre,
                    m?.usuarioEmail
                ].some(v => String(v ?? '').toLowerCase().includes(q))
                if (!hay) return
            }

            setTribuCardLastUpdatedAt(new Date().toISOString())

            const ms = m?.fecha ? new Date(m.fecha).getTime() : 0
            const prevSeen = tribuCardLastSeenMsRef.current
            const isNew = prevSeen > 0 && Number.isFinite(ms) && ms > prevSeen

            if (Number.isFinite(ms) && ms > (tribuCardLastSeenMsRef.current || 0)) {
                tribuCardLastSeenMsRef.current = ms
            }

            if (isNew) {
                setTribuCardNewCount((n) => n + 1)
                setTribuCardHighlightAfterMs(prevSeen)
            }

            setTribuCardMovs(prev => {
                const prevItems = prev?.items || []
                const nextItems = [m, ...prevItems.filter(x => x?.id !== m?.id)]
                return { ...prev, items: nextItems.slice(0, prev?.size || 25) }
            })
        },
        onTransferencia: (t) => {
            if (!(viewMode === 'operaciones' && tab === 'transferencias')) return

            const f = transferenciasFilters
            if (Number(f.page || 0) !== 0) return
            if (f.estado && String(t?.estado || '') !== String(f.estado)) return
            if (f.q) {
                const q = String(f.q).toLowerCase().trim()
                const hay = [
                    t?.id,
                    t?.referenciaUnica,
                    t?.mensaje,
                    t?.emisorNombre,
                    t?.emisorEmail,
                    t?.receptorNombre,
                    t?.receptorEmail
                ].some(v => String(v ?? '').toLowerCase().includes(q))
                if (!hay) return
            }

            setTransferencias(prev => {
                const prevItems = prev?.items || []
                const nextItems = [t, ...prevItems.filter(x => x?.id !== t?.id)]
                return {
                    ...prev,
                    items: nextItems.slice(0, prev?.size || 25),
                    totalElements: (prev?.totalElements || 0) + (prevItems.some(x => x?.id === t?.id) ? 0 : 1)
                }
            })
        },
    })
    useEffect(() => {
        setTribuCardWsConnected(viewMode === 'operaciones' && tab === 'tribuCard' ? adminWsConnected : false)
        setTransferenciasWsConnected(viewMode === 'operaciones' && tab === 'transferencias' ? adminWsConnected : false)
    }, [adminWsConnected, viewMode, tab])

    // Modales
    const [modalProd, setModalProd] = useState(null)
    const [notaForm, setNotaForm] = useState({ clienteId: '', contenido: '' })
    const [showNotaModal, setShowNotaModal] = useState(false)

    // ── Categorías ──
    const CAT_VACIA = { nombre: '', descripcion: '' }
    const [catModal, setCatModal] = useState(null) // null=cerrado, {}=nueva, {id,...}=editar
    const [catForm, setCatForm] = useState(CAT_VACIA)

    const cargarDatos = () => {
        setLoading(true)
        Promise.all([
            getAllPedidos(), getUsuarios(), getTodasLasNotas(),
            getStockBajo(5), getCategorias(),
            import('../api').then(m => m.getProductos()),
            getTodasLasDevoluciones().catch(() => ({ data: [] })),
            getEstadisticasDevolucion().catch(() => ({ data: null })),
            getSeguridadAccesos().catch(() => ({ data: [] })),
            getAdminFacturas().catch(() => ({ data: [] })),
            adminGetConversacionesSoporte().catch(() => ({ data: [] })),
            getAdminGirosRuleta().catch(() => ({ data: [] })),
            getAdminRuletaConfig().catch(() => ({ data: { productoRegalo: '' } }))
        ]).then(([p, u, n, s, cats, prods, devs, statsDevs, seg, fact, chats, giros, config]) => {
            setPedidos(p.data); setUsuarios(u.data)
            setNotas(n.data); setStockBajo(s.data)
            setCategorias(cats.data); setProductos(prods.data)
            setDevoluciones(devs.data || [])
            setStatsDevoluciones(statsDevs.data || null)
            setAccesos(seg.data || [])
            setFacturas(fact.data || [])
            setSoporteChats(chats.data || [])
            setGirosRuleta(giros.data || [])
            setProductoRegalo(config.data?.productoRegalo || 'Gadget Magnético Viral 🎁')
        }).finally(() => setLoading(false))
    }

    // Polling de mensajes para el chat de soporte seleccionado por el administrador
    const pollingSoporteRef = useRef(null)
    useEffect(() => {
        if (soporteChatActivo) {
            pollingSoporteRef.current = setInterval(() => {
                adminGetMensajesSoporte(soporteChatActivo.id)
                    .then(res => {
                        if (res.data && res.data.length !== soporteMensajes.length) {
                            setSoporteMensajes(res.data)
                        }
                    })
                    .catch(err => console.error('Error polling mensajes admin', err))
            }, 3000)
        }
        return () => {
            if (pollingSoporteRef.current) clearInterval(pollingSoporteRef.current)
        }
    }, [soporteChatActivo, soporteMensajes.length])

    // Polling del listado de soporte si el admin está en la pestaña de soporte
    useEffect(() => {
        let interval = null
        if (viewMode === 'operaciones' && tab === 'soporte') {
            interval = setInterval(() => {
                adminGetConversacionesSoporte()
                    .then(res => setSoporteChats(res.data || []))
                    .catch(err => console.error('Error polling listado soporte', err))
            }, 5000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [viewMode, tab])

    useEffect(cargarDatos, [])

    const handleSelectConversacion = async (chat) => {
        setSoporteCargandoChat(true)
        setSoporteChatActivo(chat)
        setSoporteMensajes([])
        try {
            const res = await adminGetMensajesSoporte(chat.id)
            setSoporteMensajes(res.data || [])
            setTimeout(() => {
                soporteMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 150)
        } catch (err) {
            toast.error('Error al cargar mensajes')
        } finally {
            setSoporteCargandoChat(false)
        }
    }

    const handleEnviarMensajeAdmin = async (e) => {
        e.preventDefault()
        if (!soporteNuevoMensaje.trim() || !soporteChatActivo) return
        setSoporteEnviando(true)
        try {
            const res = await adminEnviarMensajeSoporte(soporteChatActivo.id, soporteNuevoMensaje.trim())
            setSoporteMensajes(prev => [...prev, res.data])
            setSoporteNuevoMensaje('')
            // Actualizar el estado a humano localmente si estaba en IA, ya que intervino el administrador
            if (soporteChatActivo.estado === 'ACTIVA_IA') {
                setSoporteChatActivo(prev => ({ ...prev, estado: 'ESCALADA_HUMANO' }))
                setSoporteChats(prev => prev.map(c => c.id === soporteChatActivo.id ? { ...c, estado: 'ESCALADA_HUMANO' } : c))
            }
            setTimeout(() => {
                soporteMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
        } catch (err) {
            toast.error('Error al enviar respuesta de soporte')
        } finally {
            setSoporteEnviando(false)
        }
    }

    const handleResolverConversacion = async () => {
        if (!soporteChatActivo) return
        if (!window.confirm('¿Estás seguro de marcar esta conversación de soporte como RESUELTA? Esto desactiva el ticket.')) return
        try {
            const res = await adminResolverConversacionSoporte(soporteChatActivo.id)
            toast.success('Conversación marcada como RESUELTA ✓')
            setSoporteChatActivo(res.data)
            // Recargar listado y mensajes
            const [listRes, msgRes] = await Promise.all([
                adminGetConversacionesSoporte(),
                adminGetMensajesSoporte(soporteChatActivo.id)
            ])
            setSoporteChats(listRes.data || [])
            setSoporteMensajes(msgRes.data || [])
        } catch (err) {
            toast.error('Error al resolver la conversación de soporte')
        }
    }

    useEffect(() => {
        tribuCardFiltersRef.current = tribuCardFilters
    }, [tribuCardFilters])

    const cargarTribuCard = async (opts = {}) => {
        const base = tribuCardFiltersRef.current || tribuCardFilters
        const next = { ...base, ...opts }
        tribuCardFiltersRef.current = next
        setTribuCardFilters(next)
        setTribuCardLoading(true)
        setTribuCardErr('')
        try {
            const prevSeen = tribuCardLastSeenMsRef.current
            const [resumen, movs] = await Promise.all([
                adminGetTribuCardResumen().catch(() => ({ data: null })),
                adminGetMovimientosTribuCard(next)
            ])
            setTribuCardResumen(resumen.data)
            setTribuCardMovs(movs.data)

            const items = movs.data?.items || []
            const maxMs = items.reduce((acc, m) => {
                const ms = m?.fecha ? new Date(m.fecha).getTime() : 0
                return Math.max(acc, Number.isFinite(ms) ? ms : 0)
            }, 0)
            if (prevSeen > 0) {
                const n = items.reduce((acc, m) => {
                    const ms = m?.fecha ? new Date(m.fecha).getTime() : 0
                    return acc + (Number.isFinite(ms) && ms > prevSeen ? 1 : 0)
                }, 0)
                setTribuCardNewCount(n)
                setTribuCardHighlightAfterMs(prevSeen)
            } else {
                setTribuCardNewCount(0)
                setTribuCardHighlightAfterMs(0)
            }
            tribuCardLastSeenMsRef.current = maxMs || prevSeen
            setTribuCardLastUpdatedAt(new Date().toISOString())
        } catch (e) {
            setTribuCardErr(e.response?.data?.mensaje || e.response?.data?.message || 'No se pudo cargar Tribu Card')
        } finally {
            setTribuCardLoading(false)
        }
    }

    const cargarTransferencias = async (opts = {}) => {
        const next = { ...transferenciasFilters, ...opts }
        setTransferenciasFilters(next)
        setTransferenciasLoading(true)
        setTransferenciasErr('')
        try {
            const { data } = await adminGetTransferencias(next)
            setTransferencias(data)
        } catch (e) {
            setTransferenciasErr(e.response?.data?.mensaje || e.response?.data?.message || 'No se pudieron cargar las transferencias')
        } finally {
            setTransferenciasLoading(false)
        }
    }

    useEffect(() => {
        if (!(viewMode === 'operaciones' && tab === 'tribuCard')) return
        if (tribuCardResumen || (tribuCardMovs.items || []).length > 0 || tribuCardLoading) return
        cargarTribuCard({ page: 0 })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, tab])

    useEffect(() => {
        if (!tribuCardWatching) return
        if (!(viewMode === 'operaciones' && tab === 'tribuCard')) return
        // If WS is connected, prefer it. Polling becomes a fallback.
        if (tribuCardWsConnected) return
        const everyMs = Math.max(5, Number(tribuCardWatchEverySec) || 10) * 1000

        const id = window.setInterval(() => {
            cargarTribuCard({ page: 0 })
        }, everyMs)

        return () => window.clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tribuCardWatching, tribuCardWatchEverySec, viewMode, tab, tribuCardWsConnected])

    const norm = (v) => (v ?? '').toString().toLowerCase().trim()
    const includesQ = (text, q) => {
        const qq = norm(q)
        if (!qq) return true
        return norm(text).includes(qq)
    }

    const cambiarEstado = async (id, estado, guiaRastreo) => {
        try {
            const { data } = await actualizarEstadoPedido(id, { estado, guiaRastreo })
            setPedidos(prev => prev.map(p => p.id === id ? data : p))
            toast.success('Estado del pedido actualizado')
        } catch { toast.error('Error al actualizar estado') }
    }

    const cambiarEstadoDevolucion = async (id, estado) => {
        try {
            const { data } = await actualizarEstadoDevolucion(id, { estado });
            setDevoluciones(prev => prev.map(d => d.id === id ? data : d));
            toast.success('Estado de devolución actualizado');
        } catch { toast.error('Error al actualizar devolución'); }
    }

    const handleReembolsoDevolucion = async (id) => {
        const montoStr = window.prompt("Ingrese el monto a reembolsar a la billetera del cliente (Ej: 50000):");
        if (!montoStr) return;

        const monto = parseFloat(montoStr);
        if (isNaN(monto) || monto <= 0) {
            toast.error("Monto inválido");
            return;
        }

        try {
            await reembolsarSaldoDevolucion(id, monto);
            toast.success('Saldo reembolsado exitosamente');
            // Refresh to get updated state (backend changes it to COMPLETADA)
            cargarDatos();
        } catch (error) {
            toast.error('Error al reembolsar saldo');
        }
    };

    const handleEliminarProducto = async (id) => {
        if (!window.confirm('¿Eliminar este producto?')) return
        try {
            await eliminarProducto(id)
            setProductos(prev => prev.filter(p => p.id !== id))
            toast.success('Producto eliminado')
        } catch { toast.error('Error al eliminar') }
    }

    const handlePromover = async (uid) => {
        try {
            await promoverAdmin(uid)
            setUsuarios(prev => prev.map(u => u.id === uid ? { ...u, rol: 'ADMIN' } : u))
            toast.success('Usuario promovido a ADMIN')
        } catch { toast.error('Error al promover') }
    }

    const handleAsignarCliente = async (uid) => {
        try {
            await asignarCliente(uid)
            setUsuarios(prev => prev.map(u => u.id === uid ? { ...u, rol: 'CLIENTE' } : u))
            toast.success('Rol cambiado a CLIENTE')
        } catch { toast.error('Error al cambiar rol') }
    }

    const handleCrearNota = async (e) => {
        e.preventDefault()
        try {
            const { data } = await crearNota({ clienteId: Number(notaForm.clienteId), contenido: notaForm.contenido })
            setNotas(prev => [data, ...prev])
            setShowNotaModal(false)
            setNotaForm({ clienteId: '', contenido: '' })
            toast.success('Nota creada')
        } catch { toast.error('Error al crear nota') }
    }

    // ── Handlers de Categorías ────────────────────────────────────────────────
    const abrirCatModal = (cat = null) => {
        setCatModal(cat ?? {})
        setCatForm(cat ? { nombre: cat.nombre, descripcion: cat.descripcion || '' } : CAT_VACIA)
    }

    const handleGuardarCat = async (e) => {
        e.preventDefault()
        if (!catForm.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
        try {
            if (catModal?.id) {
                const { data } = await actualizarCategoria(catModal.id, catForm)
                setCategorias(prev => prev.map(c => c.id === data.id ? data : c))
                toast.success('Categoría actualizada')
            } else {
                const { data } = await crearCategoria(catForm)
                setCategorias(prev => [...prev, data])
                toast.success('Categoría creada ✓')
            }
            setCatModal(null)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error al guardar categoría')
        }
    }

    const handleEliminarCat = async (id) => {
        if (!window.confirm('¿Eliminar esta categoría? Los productos quedarán sin categoría.')) return
        try {
            await eliminarCategoria(id)
            setCategorias(prev => prev.filter(c => c.id !== id))
            toast.success('Categoría eliminada')
        } catch (err) {
            toast.error(err.response?.data?.message || 'No se puede eliminar (tiene productos asociados)')
        }
    }

    const tabs = [
        { id: 'tribuCard', label: 'Tribu Card', icon: <WalletCards size={15} />, count: tribuCardResumen?.movimientos24h ?? 0 },
        { id: 'transferencias', label: 'Transferencias', icon: <ArrowRightLeft size={15} />, count: transferencias?.totalElements ?? 0 },
        { id: 'soporte', label: 'Soporte En Vivo', icon: <MessageSquare size={15} color="var(--color-accent)" />, count: soporteChats.filter(c => c.estado === 'ESCALADA_HUMANO').length },
        { id: 'productos', label: 'Productos', icon: <ShoppingBag size={15} />, count: productos.length },
        { id: 'categorias', label: 'Categorías', icon: <Tag size={15} />, count: categorias.length },
        { id: 'pedidos', label: 'Pedidos', icon: <Package size={15} />, count: pedidos.length },
        { id: 'facturas', label: 'Facturas', icon: <FileText size={15} />, count: facturas.length },
        { id: 'devoluciones', label: 'Devoluciones', icon: <RotateCcw size={15} />, count: devoluciones.filter(d => d.estado === 'PENDIENTE').length },
        { id: 'usuarios', label: 'Usuarios', icon: <Users size={15} />, count: usuarios.length },
        { id: 'ruleta', label: 'Ruleta Diaria', icon: <Gift size={15} color="var(--color-primary)" />, count: girosRuleta.filter(g => g.tipoPremio === 'PRODUCTO').length },
        { id: 'crm', label: 'CRM', icon: <FileText size={15} />, count: notas.length },
        { id: 'stock', label: 'Stock Crítico', icon: <AlertTriangle size={15} />, count: stockBajo.length },
        { id: 'inventario', label: 'Finanzas e Inventario', icon: <TrendingUp size={15} color="var(--color-primary)" />, count: productos.length, link: '/admin/inventario' },
        { id: 'seguridad', label: 'Ciberseguridad', icon: <ShieldAlert size={15} color="#ef4444" />, count: accesos.filter(a => !a.exitoso).length },
    ]

    const tabMeta = {
        tribuCard: { title: 'Tribu Card', desc: 'Ledger financiero: movimientos, estados, y trazabilidad por usuario.' },
        transferencias: { title: 'Transferencias P2P', desc: 'Monitoreo de transferencias entre usuarios: emisor, receptor, referencia, estado y monto.' },
        soporte: { title: 'Soporte En Vivo', desc: 'Monitorea y atiende chats en vivo escalados a humanos o interactúa con la IA de Tribu.' },
        productos: { title: 'Catálogo', desc: 'Crea, edita y controla inventario del catálogo.' },
        categorias: { title: 'Categorías', desc: 'Organiza el catálogo para mejorar navegación y conversión.' },
        pedidos: { title: 'Gestión de pedidos', desc: 'Despacho, guías y estados del pipeline.' },
        facturas: { title: 'Facturación electrónica', desc: 'Emisión automática, datos fiscales y descarga de PDFs.' },
        devoluciones: { title: 'Devoluciones', desc: 'Aprobaciones, rechazos y reembolsos.' },
        usuarios: { title: 'Usuarios', desc: 'Roles, datos y saldo a favor.' },
        ruleta: { title: 'Gestión de Ruleta 🎰', desc: 'Configura el regalo del premio mayor, visualiza todos los giros y contacta ganadores.' },
        crm: { title: 'CRM', desc: 'Notas internas por cliente y seguimiento.' },
        stock: { title: 'Stock crítico', desc: 'Productos con riesgo de quiebre de inventario.' },
        inventario: { title: 'Finanzas e Inventario', desc: 'Control contable, desglose de COGS, MCU y rendimiento del inventario.' },
        seguridad: { title: 'Ciberseguridad', desc: 'Monitoreo de accesos y fallos recientes.' },
    }

    const productosView = productos
        .filter(p => {
            if (opsFilters.productosCategoriaId) {
                if (Number(p.categoriaId) !== Number(opsFilters.productosCategoriaId)) return false
            }
            const hay = [p.id, p.nombre, p.descripcion, p.categoriaNombre].some(v => includesQ(v, opsFilters.q))
            return hay
        })

    const categoriasView = categorias.filter(c => [c.id, c.nombre, c.descripcion].some(v => includesQ(v, opsFilters.q)))

    const pedidosView = pedidos
        .filter(p => {
            if (opsFilters.pedidosEstado && p.estado !== opsFilters.pedidosEstado) return false
            const hay = [p.id, p.clienteNombre, p.clienteEmail, p.direccionEnvio, p.guiaRastreo, p.estado].some(v => includesQ(v, opsFilters.q))
            return hay
        })

    const devolucionesView = devoluciones
        .filter(d => {
            if (opsFilters.devolucionesEstado && d.estado !== opsFilters.devolucionesEstado) return false
            const hay = [d.id, d.orderNumber, d.email, d.reason, d.estado].some(v => includesQ(v, opsFilters.q))
            return hay
        })

    const usuariosView = usuarios
        .filter(u => {
            if (opsFilters.usuariosRol && u.rol !== opsFilters.usuariosRol) return false
            const hay = [u.id, u.nombreCompleto, u.email, u.ciudad, u.telefono, u.rol].some(v => includesQ(v, opsFilters.q))
            return hay
        })

    const notasView = notas.filter(n => [n.id, n.clienteNombre, n.clienteEmail, n.adminNombre, n.contenido].some(v => includesQ(v, opsFilters.q)))

    const facturasView = facturas
        .filter(f => [f.id, f.numeroFactura, f.nit, f.razonSocial, f.estado, f.pedidoId].some(v => includesQ(v, opsFilters.q)))
        .sort((a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime())

    const stockBajoView = stockBajo.filter(p => [p.id, p.nombre, p.categoriaNombre].some(v => includesQ(v, opsFilters.q)))

    const transferenciasView = (transferencias.items || []).filter(t => {
        const q = transferenciasFilters.q
        return [
            t?.id,
            t?.referenciaUnica,
            t?.estado,
            t?.mensaje,
            t?.emisorNombre,
            t?.emisorEmail,
            t?.receptorNombre,
            t?.receptorEmail
        ].some(v => includesQ(v, q))
    })

    const girosView = (girosRuleta || [])
        .filter(g => {
            const u = g.usuario || {}
            return [
                g.id,
                g.tipoPremio,
                g.tipoGiro,
                g.labelPremio,
                g.codigoPremio,
                u.nombreCompleto,
                u.email,
                u.ciudad,
                u.telefono
            ].some(v => includesQ(v, opsFilters.q))
        })
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    if (loading) return <div className="spinner" style={{ marginTop: '4rem' }} />

    const totalVentas = pedidos.reduce((acc, p) => acc + (Number(p.total || 0)), 0)
    const hayVentas = pedidos.length > 0
    const pedidosPendientes = pedidos.filter(p => p.estado === 'PENDIENTE').length
    const pedidosPagados = pedidos.filter(p => p.estado === 'PAGADO').length
    const pedidosEnviados = pedidos.filter(p => p.estado === 'ENVIADO').length
    const pedidosEntregados = pedidos.filter(p => p.estado === 'ENTREGADO').length
    const devolucionesPendientes = devoluciones.filter(d => d.estado === 'PENDIENTE').length
    const ingresosRegistrados = totalVentas

    const topProductos = [...productos]
        .sort((a, b) => (b.stock || 0) - (a.stock || 0))
        .slice(0, 5)

    const stockCriticoList = stockBajo.slice(0, 5)

    const orderFlow = [
        { label: 'Pendientes', value: pedidosPendientes, color: '#f59e0b' },
        { label: 'Pagados', value: pedidosPagados, color: '#22c55e' },
        { label: 'Enviados', value: pedidosEnviados, color: '#3b82f6' },
        { label: 'Entregados', value: pedidosEntregados, color: '#10b981' }
    ]
    const maxFlow = Math.max(1, ...orderFlow.map(o => o.value))

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
    const buildDayKey = (date) => date.toISOString().slice(0, 10)
    const last7Days = Array.from({ length: 7 }, (_, idx) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - idx))
        d.setHours(0, 0, 0, 0)
        return d
    })
    const salesByDay = {}
    const ordersByDay = {}
    last7Days.forEach(d => {
        const key = buildDayKey(d)
        salesByDay[key] = 0
        ordersByDay[key] = 0
    })
    pedidos.forEach(p => {
        if (!p.fechaPedido) return
        const fecha = new Date(p.fechaPedido)
        if (Number.isNaN(fecha.getTime())) return
        const dayKey = buildDayKey(new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()))
        if (salesByDay[dayKey] !== undefined) {
            salesByDay[dayKey] += Number(p.total || 0)
            ordersByDay[dayKey] += 1
        }
    })
    const maxVentasDia = Math.max(1, ...Object.values(salesByDay))
    const maxPedidosDia = Math.max(1, ...Object.values(ordersByDay))

    return (
        <div
            className="container"
            style={{
                padding: '2.5rem 1.5rem 6rem',
                minHeight: '100vh',
                background: 'radial-gradient(circle at 20% -10%, #222 0%, #0f0f0f 45%, #0a0a0a 100%)'
            }}
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}
            >
                <div>
                    <p style={{ color: '#8b8b8b', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Administrador</p>
                    <h1 className="page-title" style={{ marginBottom: '0.4rem' }}>Centro de Control</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                        Tribu · Medellín, Antioquia — Estado general del negocio en tiempo real
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', background: 'rgba(255,255,255,0.04)', borderRadius: '999px', padding: '0.35rem' }}>
                    {[
                        { id: 'overview', label: 'Resumen' },
                        { id: 'operaciones', label: 'Operaciones' }
                    ].map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => setViewMode(mode.id)}
                            style={{
                                border: 'none',
                                background: viewMode === mode.id ? 'linear-gradient(135deg, #f97316, #f59e0b)' : 'transparent',
                                color: viewMode === mode.id ? '#0a0a0a' : '#aaa',
                                padding: '0.45rem 0.9rem',
                                borderRadius: '999px',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="admin-stats-grid"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}
            >
                {[
                    { label: 'Ventas', value: hayVentas ? formatCOP(totalVentas || 0) : 'Sin datos', color: '#22c55e', Icon: TrendingUp, hint: hayVentas ? 'Tendencia por definir' : 'Aun no hay ventas' },
                    { label: 'Pedidos', value: pedidos.length, color: '#3b82f6', Icon: Package, hint: `${pedidosPendientes} pendientes` },
                    { label: 'Stock crítico', value: stockBajo.length, color: '#ef4444', Icon: AlertTriangle, link: '/admin/inventario', hint: 'Ver inventario completo' },
                    { label: 'Usuarios', value: usuarios.length, color: '#a855f7', Icon: Users, hint: 'Clientes activos' },
                    { label: 'Devoluciones', value: devolucionesPendientes, color: '#f97316', Icon: RotateCcw, hint: 'Pendientes' },
                    { label: 'Campañas', value: 'Ver', color: '#facc15', Icon: Zap, link: '/admin/campanas', hint: 'Marketing' },
                ].map((s, i) => (
                    <motion.div key={s.label} className="card" whileHover={{ scale: 1.03, borderColor: s.color + '40' }}
                        onClick={() => s.link && (window.location.href = s.link)}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        style={{ textAlign: 'left', cursor: s.link ? 'pointer' : 'default', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <div>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: s.color }}>{s.value}</p>
                                <p style={{ color: '#8b8b8b', fontSize: '0.74rem' }}>{s.hint}</p>
                            </div>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <s.Icon size={22} color={s.color} strokeWidth={1.8} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {viewMode === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Flujo de pedidos</h3>
                                <p style={{ color: '#8b8b8b', fontSize: '0.85rem' }}>Estados actuales del pipeline</p>
                            </div>
                            <BarChart3 size={20} color="#f97316" />
                        </div>
                        {hayVentas ? (
                            <>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {orderFlow.map(item => (
                                        <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ color: '#c4c4c4', fontSize: '0.85rem' }}>{item.label}</span>
                                            <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                                <div style={{ width: `${(item.value / maxFlow) * 100}%`, height: '100%', background: item.color, borderRadius: 999 }} />
                                            </div>
                                            <span style={{ color: '#f1f1f1', fontWeight: 700, textAlign: 'right' }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#22c55e', fontSize: '0.8rem' }}>
                                        <ArrowUpRight size={14} /> Conversión estable
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f97316', fontSize: '0.8rem' }}>
                                        <Activity size={14} /> Revisa los pendientes diarios
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#8b8b8b' }}>
                                <BarChart3 size={28} color="#555" />
                                <p style={{ marginTop: '0.6rem' }}>Sin pedidos aun. Los datos apareceran cuando se registren ventas.</p>
                            </div>
                        )}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Ingresos</h3>
                                <p style={{ color: '#8b8b8b', fontSize: '0.85rem' }}>Total de ventas registradas</p>
                            </div>
                            <Sparkles size={20} color="#a855f7" />
                        </div>
                        {hayVentas ? (
                            <>
                                <p style={{ fontSize: '2rem', fontWeight: 900, color: '#a855f7', marginBottom: '0.5rem' }}>
                                    {formatCOP(ingresosRegistrados)}
                                </p>
                                <p style={{ color: '#8b8b8b', fontSize: '0.85rem' }}>Actualizado con pedidos registrados</p>
                                <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.6rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: '#c4c4c4' }}>Ventas totales</span>
                                        <span style={{ color: '#22c55e', fontWeight: 700 }}>{formatCOP(totalVentas || 0)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: '#c4c4c4' }}>Devoluciones pendientes</span>
                                        <span style={{ color: '#f97316', fontWeight: 700 }}>{devolucionesPendientes}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: '#c4c4c4' }}>Stock critico</span>
                                        <span style={{ color: '#ef4444', fontWeight: 700 }}>{stockBajo.length}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#8b8b8b' }}>
                                <Sparkles size={26} color="#555" />
                                <p style={{ marginTop: '0.6rem' }}>No hay ventas aun. Este panel se completa automaticamente.</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {viewMode === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 0.8fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Ventas por dia (7 dias)</h3>
                                <p style={{ color: '#8b8b8b', fontSize: '0.85rem' }}>Basado en pedidos registrados</p>
                            </div>
                            <TrendingUp size={20} color="#22c55e" />
                        </div>
                        {hayVentas ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', alignItems: 'end', gap: '0.75rem', height: 180 }}>
                                {last7Days.map(d => {
                                    const key = buildDayKey(d)
                                    const value = salesByDay[key]
                                    const height = Math.max(8, (value / maxVentasDia) * 160)
                                    return (
                                        <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                                            <div style={{ width: '100%', height: 160, display: 'flex', alignItems: 'flex-end' }}>
                                                <div style={{ width: '100%', height, background: 'linear-gradient(180deg, rgba(34,197,94,0.9), rgba(34,197,94,0.2))', borderRadius: 10 }} />
                                            </div>
                                            <span style={{ color: '#8b8b8b', fontSize: '0.72rem' }}>{dayNames[d.getDay()]}</span>
                                            <span style={{ color: '#f1f1f1', fontSize: '0.72rem', fontWeight: 700 }}>{formatCOP(value)}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#8b8b8b' }}>
                                <TrendingUp size={28} color="#555" />
                                <p style={{ marginTop: '0.6rem' }}>Sin ventas aun. La grafica se llena automaticamente.</p>
                            </div>
                        )}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Pedidos por dia</h3>
                                <p style={{ color: '#8b8b8b', fontSize: '0.85rem' }}>Cantidad de pedidos</p>
                            </div>
                            <Package size={20} color="#3b82f6" />
                        </div>
                        {hayVentas ? (
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {last7Days.map(d => {
                                    const key = buildDayKey(d)
                                    const value = ordersByDay[key]
                                    return (
                                        <div key={key} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 40px', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ color: '#8b8b8b', fontSize: '0.75rem' }}>{dayNames[d.getDay()]}</span>
                                            <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                                <div style={{ width: `${(value / maxPedidosDia) * 100}%`, height: '100%', background: '#3b82f6', borderRadius: 999 }} />
                                            </div>
                                            <span style={{ color: '#f1f1f1', fontSize: '0.75rem', fontWeight: 700, textAlign: 'right' }}>{value}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#8b8b8b' }}>
                                <Package size={28} color="#555" />
                                <p style={{ marginTop: '0.6rem' }}>Sin pedidos aun. Esta vista aparecera cuando haya ventas.</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {viewMode === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Inventario estratégico</h3>
                                <p style={{ color: '#8b8b8b', fontSize: '0.85rem' }}>Top productos por stock disponible</p>
                            </div>
                            <button
                                onClick={() => window.location.href = '/admin/inventario'}
                                style={{ border: 'none', background: 'rgba(255,255,255,0.04)', color: '#f97316', padding: '0.4rem 0.8rem', borderRadius: 999, cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}
                            >
                                Ver inventario
                            </button>
                        </div>
                        {topProductos.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#8b8b8b' }}>
                                <Package size={26} color="#555" />
                                <p style={{ marginTop: '0.6rem' }}>Aun no hay productos cargados.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {topProductos.map(p => (
                                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: '0.75rem', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Package size={16} color="#f97316" />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{p.nombre}</p>
                                                <p style={{ color: '#8b8b8b', fontSize: '0.75rem' }}>{p.categoriaNombre || 'Sin categoría'}</p>
                                            </div>
                                        </div>
                                        <span style={{ color: '#c4c4c4', fontSize: '0.8rem' }}>Stock</span>
                                        <span style={{ color: '#f1f1f1', fontWeight: 700, textAlign: 'right' }}>{p.stock}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Alertas críticas</h3>
                                <p style={{ color: '#8b8b8b', fontSize: '0.85rem' }}>Productos con bajo stock</p>
                            </div>
                            <AlertTriangle size={20} color="#ef4444" />
                        </div>
                        {stockCriticoList.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#8b8b8b', padding: '1.5rem 0' }}>
                                <Check size={28} color="#22c55e" />
                                <p style={{ marginTop: '0.5rem' }}>Todo en orden</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {stockCriticoList.map(p => (
                                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>{p.nombre}</p>
                                            <p style={{ color: '#8b8b8b', fontSize: '0.75rem' }}>{p.categoriaNombre || 'Sin categoría'}</p>
                                        </div>
                                        <span style={{ color: '#ef4444', fontWeight: 800 }}>{p.stock}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Operaciones */}
            {viewMode === 'operaciones' && (
                <div className="admin-ops-grid" style={{ marginBottom: '2rem' }}>
                    <aside className="card admin-ops-sidenav" style={{ padding: '1.25rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ color: '#8b8b8b', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Operaciones</p>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.86rem' }}>Gestiona pedidos, inventario, CRM y seguridad.</p>
                        </div>

                        <div style={{ display: 'grid', gap: '0.35rem' }}>
                            {tabs.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        if (t.link) {
                                            window.location.href = t.link;
                                        } else if (t.id === 'seguridad') {
                                            window.location.href = '/admin/seguridad';
                                        } else {
                                            setTab(t.id);
                                        }
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                                        padding: '0.75rem 0.8rem',
                                        borderRadius: 12,
                                        border: '1px solid ' + (tab === t.id ? 'rgba(255,87,34,0.35)' : 'var(--color-border)'),
                                        background: tab === t.id ? 'rgba(255,87,34,0.08)' : 'rgba(255,255,255,0.02)',
                                        cursor: 'pointer',
                                        color: tab === t.id ? 'var(--color-text)' : 'var(--color-text-muted)'
                                    }}
                                    title={t.label}
                                >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', fontWeight: 750 }}>
                                        {t.icon} {t.label}
                                    </span>
                                    <span style={{
                                        minWidth: 32,
                                        textAlign: 'center',
                                        padding: '2px 8px',
                                        borderRadius: 999,
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        background: tab === t.id ? 'var(--color-primary)' : 'var(--color-surface-2)',
                                        color: tab === t.id ? '#0a0a0a' : 'var(--color-text-muted)'
                                    }}>
                                        {t.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                            <p style={{ fontSize: '0.78rem', color: '#8b8b8b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Atajos</p>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <button onClick={() => window.location.href = '/admin/campanas'} className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                                    <Zap size={15} /> Campañas
                                </button>
                                <button onClick={() => window.location.href = '/admin/inventario'} className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                                    <Package size={15} /> Inventario
                                </button>
                                <button onClick={() => window.location.href = '/admin/telegram'} className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                                    <Activity size={15} /> Telegram
                                </button>
                            </div>
                        </div>
                    </aside>

                    <section className="card admin-ops-main" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            <div>
                                <h2 style={{ fontWeight: 900, marginBottom: '0.25rem' }}>{tabMeta[tab]?.title || 'Operaciones'}</h2>
                                <p style={{ color: '#8b8b8b', fontSize: '0.88rem' }}>{tabMeta[tab]?.desc || 'Herramientas operativas del negocio.'}</p>
                            </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <motion.button
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={cargarDatos}
                                    className="btn btn-ghost"
                                    style={{ borderColor: 'rgba(255,87,34,0.25)' }}
                                    title="Actualizar datos"
                                >
                                    <RefreshCw size={15} /> Actualizar
                                </motion.button>
                                {tab === 'tribuCard' && (
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => {
                                            const next = !tribuCardWatching
                                            setTribuCardWatching(next)
                                            if (next) cargarTribuCard({ page: 0 })
                                        }}
                                        className={tribuCardWatching ? 'btn btn-ghost' : 'btn btn-primary'}
                                        title={tribuCardWatching ? 'Pausar monitoreo' : 'Activar monitoreo'}
                                    >
                                        <WalletCards size={16} /> {tribuCardWatching ? 'Pausar' : 'Vigilar'}
                                    </motion.button>
                                )}
                                {tab === 'transferencias' && (
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => cargarTransferencias({ page: 0 })}
                                        className="btn btn-primary"
                                        title="Cargar transferencias"
                                    >
                                        <ArrowRightLeft size={16} /> Cargar
                                    </motion.button>
                                )}
                                {tab === 'productos' && (
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => setModalProd({})} className="btn btn-primary">
                                        <Plus size={16} /> Nuevo
                                    </motion.button>
                                )}
                                {tab === 'categorias' && (
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => abrirCatModal()} className="btn btn-primary">
                                        <Plus size={16} /> Nueva
                                    </motion.button>
                                )}
                                {tab === 'crm' && (
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => setShowNotaModal(true)} className="btn btn-primary">
                                        <Plus size={16} /> Nota
                                    </motion.button>
                                )}
                            </div>
                        </div>

                        {/* Tabs (mobile) */}
                        <div className="admin-ops-tabs-mobile"
                            style={{
                                gap: '0.25rem',
                                borderBottom: '1px solid var(--color-border)',
                                marginBottom: '1rem',
                                overflowX: 'auto'
                            }}
                        >
                            {tabs.map(t => (
                                <button key={t.id} onClick={() => setTab(t.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap',
                                        padding: '0.6rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer',
                                        color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                        fontWeight: 700, fontSize: '0.87rem', transition: 'all 0.2s',
                                    }}>
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        {/* KPIs operativos */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                            {[
                                { label: 'Pendientes', value: pedidosPendientes, color: '#f59e0b', Icon: Package, onClick: () => { setTab('pedidos'); setOpsFilters(f => ({ ...f, pedidosEstado: 'PENDIENTE' })) } },
                                { label: 'Pagados', value: pedidosPagados, color: '#22c55e', Icon: Package, onClick: () => { setTab('pedidos'); setOpsFilters(f => ({ ...f, pedidosEstado: 'PAGADO' })) } },
                                { label: 'Devoluciones', value: devolucionesPendientes, color: '#f97316', Icon: RotateCcw, onClick: () => { setTab('devoluciones'); setOpsFilters(f => ({ ...f, devolucionesEstado: 'PENDIENTE' })) } },
                                { label: 'Stock crítico', value: stockBajo.length, color: '#ef4444', Icon: AlertTriangle, onClick: () => { setTab('stock') } },
                            ].map(k => (
                                <motion.button
                                    key={k.label}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={k.onClick}
                                    style={{
                                        border: '1px solid var(--color-border)',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 14,
                                        padding: '0.9rem 1rem',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                        <div>
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</p>
                                            <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 900, fontSize: '1.35rem', color: k.color }}>{k.value}</p>
                                        </div>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${k.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <k.Icon size={20} color={k.color} strokeWidth={1.8} />
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {/* Controles */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 220px)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} color="#8b8b8b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    className="input"
                                    value={tab === 'tribuCard' ? tribuCardFilters.q : tab === 'transferencias' ? transferenciasFilters.q : opsFilters.q}
                                    onChange={(e) => {
                                        const v = e.target.value
                                        if (tab === 'tribuCard') setTribuCardFilters(f => ({ ...f, q: v }))
                                        else if (tab === 'transferencias') setTransferenciasFilters(f => ({ ...f, q: v }))
                                        else setOpsFilters(f => ({ ...f, q: v }))
                                    }}
                                     placeholder={tab === 'tribuCard'
                                         ? 'Buscar por usuario/email, descripcion, #mov o #pedido...'
                                         : tab === 'transferencias' ? 'Buscar por emisor/receptor, referencia o mensaje...'
                                        : tab === 'pedidos' ? 'Buscar por cliente, email, guia o #...'
                                            : tab === 'facturas' ? 'Buscar por NIT, razon social o #factura...'
                                                : tab === 'devoluciones' ? 'Buscar por pedido, email o motivo...'
                                                    : tab === 'usuarios' ? 'Buscar por nombre o email...'
                                                        : tab === 'ruleta' ? 'Buscar por cliente, premio, tipo o cupón...'
                                                            : tab === 'productos' ? 'Buscar producto o categoria...' : 'Buscar...'}
                                    style={{ paddingLeft: 40 }}
                                />
                            </div>

                            {tab === 'tribuCard' && (
                                <select
                                    className="input"
                                    value={tribuCardFilters.estado}
                                    onChange={(e) => setTribuCardFilters(f => ({ ...f, estado: e.target.value }))}
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="PENDING">PENDING</option>
                                    <option value="ON_HOLD">ON_HOLD</option>
                                    <option value="CLEARED">CLEARED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                </select>
                            )}
                            {tab === 'transferencias' && (
                                <select
                                    className="input"
                                    value={transferenciasFilters.estado}
                                    onChange={(e) => setTransferenciasFilters(f => ({ ...f, estado: e.target.value }))}
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="PENDIENTE">PENDIENTE</option>
                                    <option value="COMPLETADA">COMPLETADA</option>
                                    <option value="CANCELADA">CANCELADA</option>
                                    <option value="FALLIDA">FALLIDA</option>
                                </select>
                            )}
                            {tab === 'pedidos' && (
                                <select
                                    className="input"
                                    value={opsFilters.pedidosEstado}
                                    onChange={(e) => setOpsFilters(f => ({ ...f, pedidosEstado: e.target.value }))}
                                >
                                    <option value="">Todos los estados</option>
                                    {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}
                            {tab === 'devoluciones' && (
                                <select
                                    className="input"
                                    value={opsFilters.devolucionesEstado}
                                    onChange={(e) => setOpsFilters(f => ({ ...f, devolucionesEstado: e.target.value }))}
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="PENDIENTE">PENDIENTE</option>
                                    <option value="APROBADA">APROBADA</option>
                                    <option value="RECHAZADA">RECHAZADA</option>
                                    <option value="COMPLETADA">COMPLETADA</option>
                                </select>
                            )}
                            {tab === 'usuarios' && (
                                <select
                                    className="input"
                                    value={opsFilters.usuariosRol}
                                    onChange={(e) => setOpsFilters(f => ({ ...f, usuariosRol: e.target.value }))}
                                >
                                    <option value="">Todos los roles</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="CLIENTE">CLIENTE</option>
                                </select>
                            )}
                            {tab === 'productos' && (
                                <select
                                    className="input"
                                    value={opsFilters.productosCategoriaId}
                                    onChange={(e) => setOpsFilters(f => ({ ...f, productosCategoriaId: e.target.value }))}
                                >
                                    <option value="">Todas las categorias</option>
                                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            )}
                            {!['tribuCard', 'transferencias', 'pedidos', 'devoluciones', 'usuarios', 'productos'].includes(tab) && (
                                <div style={{ height: 44 }} />
                            )}
                        </div>

                        {tab === 'transferencias' && (
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
                                <span style={{
                                    padding: '0.18rem 0.55rem',
                                    borderRadius: 999,
                                    fontSize: '0.75rem',
                                    fontWeight: 900,
                                    background: transferenciasWsConnected ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.12)',
                                    border: transferenciasWsConnected ? '1px solid rgba(34,197,94,0.22)' : '1px solid rgba(239,68,68,0.2)',
                                    color: transferenciasWsConnected ? '#22c55e' : '#ef4444'
                                }}>
                                    WS {transferenciasWsConnected ? 'ON' : 'OFF'}
                                </span>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => cargarTransferencias({ page: 0 })}
                                    className="btn btn-primary"
                                >
                                    <Search size={16} /> Aplicar
                                </motion.button>

                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        const reset = { q: '', estado: '', page: 0, size: 25 }
                                        setTransferenciasFilters(reset)
                                        cargarTransferencias(reset)
                                    }}
                                    className="btn btn-ghost"
                                >
                                    <X size={16} /> Limpiar
                                </motion.button>

                                {transferenciasErr && <span style={{ color: '#ef4444', fontWeight: 700 }}>{transferenciasErr}</span>}
                            </div>
                        )}

                        {tab === 'tribuCard' && (
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', fontWeight: 800 }}>Monitoreo</span>
                                    <button
                                        className={tribuCardWatching ? 'btn btn-primary' : 'btn btn-ghost'}
                                        onClick={() => {
                                            const next = !tribuCardWatching
                                            setTribuCardWatching(next)
                                            if (next) cargarTribuCard({ page: 0 })
                                        }}
                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                    >
                                        {tribuCardWatching ? 'Activo' : 'Inactivo'}
                                    </button>
                                    <span style={{
                                        padding: '0.18rem 0.55rem',
                                        borderRadius: 999,
                                        fontSize: '0.75rem',
                                        fontWeight: 900,
                                        background: tribuCardWsConnected ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.12)',
                                        border: tribuCardWsConnected ? '1px solid rgba(34,197,94,0.22)' : '1px solid rgba(239,68,68,0.2)',
                                        color: tribuCardWsConnected ? '#22c55e' : '#ef4444'
                                    }}>
                                        WS {tribuCardWsConnected ? 'ON' : 'OFF'}
                                    </span>
                                    <select
                                        className="input"
                                        value={String(tribuCardWatchEverySec)}
                                        onChange={(e) => setTribuCardWatchEverySec(Number(e.target.value) || 10)}
                                        style={{ width: 120 }}
                                        title="Frecuencia de refresco"
                                    >
                                        <option value="5">5s</option>
                                        <option value="10">10s</option>
                                        <option value="30">30s</option>
                                    </select>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                        {tribuCardLastUpdatedAt ? `Ult. act.: ${new Date(tribuCardLastUpdatedAt).toLocaleTimeString('es-CO')}` : 'Ult. act.: —'}
                                    </span>
                                    {tribuCardWatching && tribuCardNewCount > 0 && (
                                        <span style={{
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: 999,
                                            fontSize: '0.75rem',
                                            fontWeight: 900,
                                            background: 'rgba(34,197,94,0.16)',
                                            border: '1px solid rgba(34,197,94,0.25)',
                                            color: '#22c55e'
                                        }}>
                                            +{tribuCardNewCount} nuevos
                                        </span>
                                    )}
                                </div>

                                <select className="input" style={{ maxWidth: 260 }}
                                    value={tribuCardFilters.tipo}
                                    onChange={(e) => setTribuCardFilters(f => ({ ...f, tipo: e.target.value }))}
                                >
                                    <option value="">Todos los tipos</option>
                                    <option value="PURCHASE">PURCHASE</option>
                                    <option value="CASHBACK">CASHBACK</option>
                                    <option value="ROULETTE_REWARD">ROULETTE_REWARD</option>
                                    <option value="REFERRAL_BONUS">REFERRAL_BONUS</option>
                                    <option value="WELCOME_BONUS">WELCOME_BONUS</option>
                                    <option value="REEMBOLSO">REEMBOLSO</option>
                                    <option value="AJUSTE_ADMIN">AJUSTE_ADMIN</option>
                                    <option value="TRANSFERENCIA_ENVIADA">TRANSFERENCIA_ENVIADA</option>
                                    <option value="TRANSFERENCIA_RECIBIDA">TRANSFERENCIA_RECIBIDA</option>
                                    <option value="TRIBU_PASS_PAGO">TRIBU_PASS_PAGO</option>
                                </select>

                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => cargarTribuCard({ page: 0 })}
                                    className="btn btn-primary"
                                >
                                    <Search size={16} /> Aplicar
                                </motion.button>

                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        const reset = { q: '', estado: '', tipo: '', page: 0, size: 25 }
                                        setTribuCardFilters(reset)
                                        tribuCardFiltersRef.current = reset
                                        tribuCardLastSeenMsRef.current = 0
                                        setTribuCardNewCount(0)
                                        setTribuCardHighlightAfterMs(0)
                                        setTribuCardLastUpdatedAt('')
                                        cargarTribuCard(reset)
                                    }}
                                    className="btn btn-ghost"
                                >
                                    <X size={16} /> Limpiar
                                </motion.button>

                                {tribuCardErr && <span style={{ color: '#ef4444', fontWeight: 700 }}>{tribuCardErr}</span>}
                            </div>
                        )}

            {/* ═══ TAB: PRODUCTOS ══════════════════════════════════════════════════ */}
            {viewMode === 'operaciones' && tab === 'productos' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="table-wrap">
                        <table>
                            <thead><tr>
                                <th>Imagen</th><th>Producto</th><th>Categoría</th>
                                <th>Precio</th><th>Stock</th><th>Viral</th><th>Acciones</th>
                            </tr></thead>
                            <tbody>
                                {productosView.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                        Sin resultados. Ajusta filtros o crea un producto.
                                    </td></tr>
                                ) : productosView.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--color-surface-2)' }}>
                                                {p.imagenUrl
                                                    ? <img src={p.imagenUrl} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Package size={18} color="var(--color-text-faint)" /></div>
                                                }
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                                            {p.descripcion && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>}
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{p.categoriaNombre || '—'}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatCOP(p.precio)}</td>
                                        <td>
                                            <span style={{ color: p.stock <= 5 ? '#ef4444' : p.stock <= 15 ? 'var(--color-accent-dark)' : 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                {p.stock <= 5 && <AlertTriangle size={13} />}{p.stock}
                                            </span>
                                        </td>
                                        <td>
                                            {p.esViral
                                                ? <span className="badge badge-viral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Zap size={11} />Viral</span>
                                                : <span style={{ color: 'var(--color-text-faint)', fontSize: '0.82rem' }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                    onClick={() => setModalProd(p)}
                                                    style={{ background: 'rgba(255,87,34,0.12)', border: '1px solid rgba(255,87,34,0.2)', borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer', color: 'var(--color-primary)' }}
                                                    title="Editar">
                                                    <Pencil size={14} />
                                                </motion.button>
                                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleEliminarProducto(p.id)}
                                                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer', color: '#ef4444' }}
                                                    title="Eliminar">
                                                    <Trash2 size={14} />
                                                </motion.button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* ═══ TAB: CATEGORÍAS ══════════════════════════════════════════════════ */}
            {viewMode === 'operaciones' && tab === 'categorias' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {categoriasView.length === 0 ? (
                        <div className="empty-state">
                            <Tag size={48} style={{ opacity: 0.3 }} />
                            <p>Sin resultados</p>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead><tr>
                                    <th>#</th><th>Nombre</th><th>Descripción</th><th>Acciones</th>
                                </tr></thead>
                                <tbody>
                                    {categoriasView.map((cat, i) => (
                                        <tr key={cat.id}>
                                            <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>#{cat.id}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Tag size={14} color="var(--color-primary)" />
                                                    <span style={{ fontWeight: 700 }}>{cat.nombre}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', maxWidth: 280 }}>
                                                {cat.descripcion || <span style={{ opacity: 0.4 }}>Sin descripción</span>}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                        onClick={() => abrirCatModal(cat)}
                                                        style={{ background: 'rgba(255,87,34,0.12)', border: '1px solid rgba(255,87,34,0.2)', borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer', color: 'var(--color-primary)' }}
                                                        title="Editar">
                                                        <Pencil size={14} />
                                                    </motion.button>
                                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleEliminarCat(cat.id)}
                                                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer', color: '#ef4444' }}
                                                        title="Eliminar">
                                                        <Trash2 size={14} />
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ═══ TAB: PEDIDOS ════════════════════════════════════════════════════ */}
            {viewMode === 'operaciones' && tab === 'pedidos' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>#</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Dirección</th><th>Guía</th><th>Cambiar estado</th></tr></thead>
                            <tbody>
                                {pedidosView.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No hay pedidos aún</td></tr>
                                ) : pedidosView.map(p => (
                                    <tr key={p.id}>
                                        <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>#{p.id}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{p.clienteNombre}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{p.clienteEmail}</div>
                                        </td>
                                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatCOP(p.total)}</td>
                                        <td><span className={`badge ${estadoColor[p.estado] || ''}`}>{p.estado}</span></td>
                                        <td style={{ fontSize: '0.82rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.direccionEnvio}</td>
                                        <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{p.guiaRastreo || '—'}</td>
                                        <td>
                                            <select value={p.estado}
                                                onChange={e => {
                                                    const guia = e.target.value === 'ENVIADO' ? prompt('Guía de rastreo (opcional):') : null
                                                    cambiarEstado(p.id, e.target.value, guia)
                                                }}
                                                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)', padding: '0.3rem 0.6rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                                                {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* ═══ TAB: FACTURAS ════════════════════════════════════════════════════ */}
            {viewMode === 'operaciones' && tab === 'facturas' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>#</th><th>Factura</th><th>Pedido</th><th>NIT</th><th>Razón Social</th><th>Total</th><th>Estado</th><th>Actualizar</th></tr></thead>
                            <tbody>
                                {facturasView.length === 0 ? (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No hay facturas aún</td></tr>
                                ) : facturasView.map(f => (
                                    <tr key={f.id}>
                                        <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>#{f.id}</td>
                                        <td style={{ fontWeight: 700 }}>{f.numeroFactura}</td>
                                        <td>#{f.pedidoId}</td>
                                        <td>{f.nit || '—'}</td>
                                        <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.razonSocial || '—'}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatCOP(f.total)}</td>
                                        <td><span className={`badge ${f.estado === 'ENVIADA' ? 'badge-entregado' : 'badge-pendiente'}`}>{f.estado}</span></td>
                                        <td>
                                            <button
                                                className="btn btn-ghost"
                                                style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                                                onClick={async () => {
                                                    const nit = window.prompt('NIT/Documento:', f.nit || '')
                                                    if (nit === null) return
                                                    const razon = window.prompt('Razón social:', f.razonSocial || '')
                                                    if (razon === null) return
                                                    try {
                                                        await adminActualizarDatosFactura(f.id, { nit, razonSocial: razon })
                                                        toast.success('Datos fiscales actualizados')
                                                        cargarDatos()
                                                    } catch (err) {
                                                        toast.error(err.response?.data?.message || 'Error al actualizar factura')
                                                    }
                                                }}
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* ═══ TAB: DEVOLUCIONES ═══════════════════════════════════════════════ */}
            {viewMode === 'operaciones' && tab === 'devoluciones' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {statsDevoluciones && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #4facfe' }}>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{statsDevoluciones.total}</div>
                            </div>
                            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #ff9800' }}>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Pendientes</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ff9800' }}>{statsDevoluciones.pendientes}</div>
                            </div>
                            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #00C896' }}>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Aprobadas</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#00C896' }}>{statsDevoluciones.aprobadas}</div>
                            </div>
                            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #ec4899' }}>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Motivo Frecuente</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.5rem', color: '#ec4899', textTransform: 'capitalize' }}>
                                    {Object.entries(statsDevoluciones.motivos || {}).sort((a, b) => b[1] - a[1])[0]
                                        ? Object.entries(statsDevoluciones.motivos).sort((a, b) => b[1] - a[1])[0][0].replace('_', ' ')
                                        : 'N/A'}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>#</th><th>Pedido</th><th>Cliente</th><th>Motivo</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead>
                            <tbody>
                                {devolucionesView.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No hay solicitudes de devolución</td></tr>
                                ) : devolucionesView.map(d => (
                                    <tr key={d.id}>
                                        <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>#{d.id}</td>
                                        <td style={{ fontWeight: 700 }}>{d.orderNumber}</td>
                                        <td>{d.email}</td>
                                        <td style={{ maxWidth: 200 }}>
                                            <div style={{ marginBottom: d.evidenciaUrl ? '0.5rem' : '0' }}>
                                                {d.reason === 'defecto' && 'Llegó defectuoso/roto'}
                                                {d.reason === 'equivocado' && 'Producto diferente'}
                                                {d.reason === 'no_gusta' && 'No cumplió expectativas'}
                                                {d.reason === 'otro' && 'Otro motivo'}
                                                {!['defecto', 'equivocado', 'no_gusta', 'otro'].includes(d.reason) && d.reason}
                                            </div>
                                            {d.evidenciaUrl && (
                                                <a href={`http://localhost:8080${d.evidenciaUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none', background: 'rgba(255, 152, 0, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                    <Image size={12} /> Ver Evidencia
                                                </a>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                            {new Date(d.fechaSolicitud).toLocaleDateString('es-CO')}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '99px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: d.estado === 'PENDIENTE' ? 'rgba(255, 152, 0, 0.15)' :
                                                    d.estado === 'APROBADA' ? 'rgba(0, 200, 150, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: d.estado === 'PENDIENTE' ? '#ff9800' :
                                                    d.estado === 'APROBADA' ? '#00C896' : '#ef4444'
                                            }}>
                                                {d.estado}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <select value={d.estado}
                                                    onChange={e => cambiarEstadoDevolucion(d.id, e.target.value)}
                                                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)', padding: '0.3rem 0.6rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                                                    <option value="PENDIENTE">PENDIENTE</option>
                                                    <option value="APROBADA">APROBADA</option>
                                                    <option value="RECHAZADA">RECHAZADA</option>
                                                    <option value="COMPLETADA">COMPLETADA</option>
                                                </select>
                                                {d.estado === 'APROBADA' && (
                                                    <button
                                                        onClick={() => handleReembolsoDevolucion(d.id)}
                                                        style={{
                                                            padding: '0.3rem 0.5rem',
                                                            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                                                            color: 'white', border: 'none', borderRadius: '4px',
                                                            fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer'
                                                        }}>
                                                        💰 Reembolsar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* ═══ TAB: USUARIOS ═══════════════════════════════════════════════════ */}
            {viewMode === 'operaciones' && tab === 'usuarios' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Nombre</th><th>Email</th><th>Ciudad</th><th>Teléfono</th><th>Rol</th><th>Saldo a Favor</th><th>Acciones</th></tr></thead>
                            <tbody>
                                {usuariosView.map(u => (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: 600 }}>{u.nombreCompleto}</td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{u.ciudad || '—'}</td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{u.telefono || '—'}</td>
                                        <td><span className={`badge ${u.rol === 'ADMIN' ? 'badge-admin' : 'badge-cliente'}`}>{u.rol}</span></td>
                                        <td style={{ fontWeight: 800, color: u.saldoFavor > 0 ? '#4facfe' : 'var(--color-text-muted)' }}>
                                            {(u.saldoFavor || 0).toLocaleString('es-CO')} pts
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {u.rol !== 'ADMIN' && (
                                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                        onClick={() => handlePromover(u.id)}
                                                        className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', color: 'var(--color-primary)', borderColor: 'rgba(255,87,34,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <TrendingUp size={13} /> Hacer ADMIN
                                                    </motion.button>
                                                )}
                                                {u.rol === 'ADMIN' && (
                                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleAsignarCliente(u.id)}
                                                        className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <TrendingDown size={13} /> A cliente
                                                    </motion.button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* ═══ TAB: RULETA ════════════════════════════════════════════════════ */}
            {viewMode === 'operaciones' && tab === 'ruleta' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* 🎁 Configuración del Regalo Mayor */}
                    <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(255,87,34,0.05) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,87,34,0.15)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ background: 'rgba(255,87,34,0.15)', padding: '0.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Gift size={24} color="var(--color-primary)" />
                            </div>
                            <div>
                                <h3 style={{ fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>Configuración de Premio Mayor</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>Personaliza el producto físico sorpresa que los usuarios pueden ganar con el segmento "¡Regalo! 🎁".</p>
                            </div>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!productoRegalo.trim()) {
                                toast.error('El nombre del regalo no puede estar vacío');
                                return;
                            }
                            setSavingConfig(true);
                            try {
                                const { data } = await saveAdminRuletaConfig({ productoRegalo: productoRegalo.trim() });
                                setProductoRegalo(data.productoRegalo);
                                toast.success('¡Premio mayor actualizado con éxito! 🎉');
                            } catch (err) {
                                toast.error(err.response?.data?.mensaje || 'Error al guardar la configuración');
                            } finally {
                                setSavingConfig(false);
                            }
                        }} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '1.5rem' }}>
                            <div className="form-group" style={{ flex: 1, minWidth: '280px', marginBottom: 0 }}>
                                <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Nombre / Descripción del Producto de Regalo</label>
                                <input
                                    className="input"
                                    type="text"
                                    value={productoRegalo}
                                    onChange={(e) => setProductoRegalo(e.target.value)}
                                    placeholder="Ej: Parlante Bluetooth JBL Go 3, Smartwatch Xiaomi, etc."
                                    required
                                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '10px' }}
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="btn btn-primary"
                                style={{ padding: '0.85rem 1.8rem', fontWeight: 800, height: '44px', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '10px' }}
                                disabled={savingConfig}
                            >
                                {savingConfig ? '⏳ Guardando...' : 'Guardar Configuración'}
                            </motion.button>
                        </form>
                    </div>

                    {/* 📊 Historial de giros */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 800, fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <RotateCw size={18} color="var(--color-primary)" /> Historial Completo de Giros
                                </h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>Verifica quién giró, qué premio obtuvo, y comunícate con ellos.</p>
                            </div>
                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const { data } = await getAdminGirosRuleta();
                                        setGirosRuleta(data || []);
                                        toast.success('Historial actualizado 🔄');
                                    } catch {
                                        toast.error('Error al actualizar historial');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="btn btn-ghost"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                            >
                                <RefreshCw size={14} /> Actualizar
                            </button>
                        </div>

                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Usuario / Ganador</th>
                                        <th>Contacto y Canje</th>
                                        <th>Tipo de Giro</th>
                                        <th>Premio Obtenido</th>
                                        <th>Código de Cupón</th>
                                        <th>Fecha / Hora</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {girosView.map(g => {
                                        const u = g.usuario || {};
                                        // Crear enlace a WhatsApp si hay teléfono
                                        const telLimpio = u.telefono ? u.telefono.replace(/\D/g, '') : '';
                                        const waLink = telLimpio ? `https://wa.me/${telLimpio.startsWith('57') ? telLimpio : '57' + telLimpio}?text=¡Hola%20${encodeURIComponent(u.nombreCompleto || '')}!%20Te%20contactamos%20de%20Tribu%20por%20tu%20premio%20en%20la%20ruleta%20🎁` : null;

                                        return (
                                            <tr key={g.id} style={{
                                                background: g.tipoPremio === 'PRODUCTO' ? 'rgba(255, 87, 34, 0.04)' : 'transparent',
                                                borderLeft: g.tipoPremio === 'PRODUCTO' ? '4px solid var(--color-primary)' : 'none'
                                            }}>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{u.nombreCompleto || 'Invitado'}</span>
                                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{u.email || '—'}</span>
                                                        {u.ciudad && <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600, marginTop: '2px' }}>📍 {u.ciudad}</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                        {u.telefono ? (
                                                            <>
                                                                <a
                                                                    href={`tel:${u.telefono}`}
                                                                    title="Llamar por teléfono"
                                                                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.35rem', color: 'var(--color-text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,87,34,0.1)'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                                                                >
                                                                    <Phone size={13} />
                                                                </a>
                                                                {waLink && (
                                                                    <a
                                                                        href={waLink}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        title="Enviar WhatsApp"
                                                                        style={{ background: '#25D366', borderRadius: '8px', padding: '0.35rem 0.5rem', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none', transition: 'transform 0.2s' }}
                                                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                                    >
                                                                        💬 WhatsApp
                                                                    </a>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>Sin teléfono</span>
                                                        )}
                                                        {u.email && (
                                                            <a
                                                                href={`mailto:${u.email}?subject=Premio%20Ganado%20en%20la%20Ruleta%20Tribu&body=Hola%20${encodeURIComponent(u.nombreCompleto || '')},%20felicitaciones%20por%20tu%20premio...`}
                                                                title="Enviar correo"
                                                                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.35rem', color: 'var(--color-text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                            >
                                                                <Mail size={13} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        padding: '0.25rem 0.6rem',
                                                        borderRadius: '99px',
                                                        background: g.tipoGiro === 'PUNTOS' ? 'rgba(79, 172, 254, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                                        color: g.tipoGiro === 'PUNTOS' ? '#4facfe' : 'var(--color-text-muted)',
                                                        border: g.tipoGiro === 'PUNTOS' ? '1px solid rgba(79, 172, 254, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                                                    }}>
                                                        {g.tipoGiro}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <span style={{
                                                            fontWeight: 800,
                                                            fontSize: '0.88rem',
                                                            color: g.tipoPremio === 'PRODUCTO' ? '#ff9800' :
                                                                g.tipoPremio === 'DESCUENTO' || g.tipoPremio === 'ENVIO_GRATIS' ? '#00C896' : 'var(--color-text)'
                                                        }}>
                                                            {g.labelPremio}
                                                        </span>
                                                        {g.tipoPremio === 'PRODUCTO' && (
                                                            <span style={{ animation: 'pulse 2s infinite', fontSize: '0.65rem', background: '#ff9800', color: 'white', padding: '1px 5px', borderRadius: '4px', fontWeight: 900 }}>RECLAMABLE</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    {g.codigoPremio ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                            <code style={{ background: 'var(--color-surface-2)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}>{g.codigoPremio}</code>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(g.codigoPremio);
                                                                    toast.success('Cupón copiado 📋');
                                                                }}
                                                                className="btn btn-ghost"
                                                                style={{ padding: '0.2rem', minWidth: 'auto', border: 'none', background: 'none' }}
                                                                title="Copiar cupón"
                                                            >
                                                                📋
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>—</span>
                                                    )}
                                                </td>
                                                <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                    {new Date(g.fecha).toLocaleString('es-CO')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {girosView.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                                <RotateCw size={36} style={{ marginBottom: '0.5rem', color: 'var(--color-text-faint)' }} />
                                                <p style={{ margin: 0 }}>No hay giros registrados con los filtros de búsqueda.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ═══ TAB: CRM ════════════════════════════════════════════════════════ */}
            {viewMode === 'operaciones' && tab === 'crm' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {notasView.map((n, i) => (
                            <motion.div key={n.id} className="card"
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <User size={14} /> {n.clienteNombre}
                                        </span>
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}> ({n.clienteEmail})</span>
                                    </div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Pencil size={12} /> {n.adminNombre} · {new Date(n.fechaCreacion).toLocaleDateString('es-CO')}
                                    </div>
                                </div>
                                <p style={{ lineHeight: 1.6 }}>{n.contenido}</p>
                            </motion.div>
                        ))}
                        {notasView.length === 0 && <div className="empty-state"><FileText size={48} /><p>No hay notas con esos filtros</p></div>}
                    </div>
                </motion.div>
            )}

            {/* ═══ TAB: TRANSFERENCIAS P2P ═══════════════════════════════════════ */}
            {viewMode === 'operaciones' && tab === 'transferencias' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {!transferencias.totalElements && (transferencias.items || []).length === 0 && !transferenciasLoading ? (
                        <div className="empty-state">
                            <ArrowRightLeft size={48} />
                            <p style={{ maxWidth: 520, margin: '0 auto' }}>
                                Aqui puedes monitorear todas las transferencias P2P entre usuarios (emisor, receptor, referencia, estado).
                            </p>
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => cargarTransferencias({ page: 0 })}
                                className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                <ArrowRightLeft size={16} /> Cargar transferencias
                            </motion.button>
                        </div>
                    ) : (
                        <>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Emisor</th>
                                            <th>Receptor</th>
                                            <th>Estado</th>
                                            <th>Monto</th>
                                            <th>Referencia</th>
                                            <th>Mensaje</th>
                                            <th>Movs</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transferenciasLoading ? (
                                            <tr><td colSpan={8} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando...</td></tr>
                                        ) : transferenciasView.length === 0 ? (
                                            <tr><td colSpan={8} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Sin transferencias con esos filtros</td></tr>
                                        ) : transferenciasView.map(t => {
                                            const montoColor = '#3b82f6'
                                            return (
                                                <tr key={t.id}>
                                                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                        {t.fechaCreacion ? new Date(t.fechaCreacion).toLocaleString('es-CO') : '—'}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700 }}>{t.emisorNombre || '—'}</div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{t.emisorEmail || '—'}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700 }}>{t.receptorNombre || '—'}</div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{t.receptorEmail || '—'}</div>
                                                    </td>
                                                    <td>
                                                        <span className="badge" style={{
                                                            background: t.estado === 'COMPLETADA' ? 'rgba(0,200,150,0.12)'
                                                                : t.estado === 'PENDIENTE' ? 'rgba(59,130,246,0.12)'
                                                                    : 'rgba(239,68,68,0.12)',
                                                            color: t.estado === 'COMPLETADA' ? '#00C896'
                                                                : t.estado === 'PENDIENTE' ? '#3b82f6'
                                                                    : '#ef4444',
                                                            border: '1px solid rgba(255,255,255,0.06)'
                                                        }}>
                                                            {t.estado}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: 900, color: montoColor, whiteSpace: 'nowrap' }}>
                                                        {formatCOP(Number(t.monto || 0))}
                                                    </td>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{t.referenciaUnica || '—'}</td>
                                                    <td style={{ maxWidth: 360 }}>
                                                        <div style={{ fontSize: '0.85rem' }}>{t.mensaje || '—'}</div>
                                                    </td>
                                                    <td style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                                                        {t.movimientoEmisorId ? `E#${t.movimientoEmisorId}` : 'E—'} · {t.movimientoReceptorId ? `R#${t.movimientoReceptorId}` : 'R—'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    {transferencias.totalElements ? `${transferencias.totalElements} transferencias` : '—'}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-ghost"
                                        disabled={transferenciasLoading || (transferencias.page || 0) <= 0}
                                        onClick={() => cargarTransferencias({ page: Math.max(0, (transferencias.page || 0) - 1) })}
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        className="btn btn-ghost"
                                        disabled={transferenciasLoading || ((transferencias.page || 0) + 1) >= (transferencias.totalPages || 0)}
                                        onClick={() => cargarTransferencias({ page: (transferencias.page || 0) + 1 })}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {/* ═══ TAB: TRIBU CARD (LEDGER) ═══════════════════════════════════════ */}
            {viewMode === 'operaciones' && tab === 'tribuCard' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {!tribuCardResumen && tribuCardMovs.items.length === 0 && !tribuCardLoading ? (
                        <div className="empty-state">
                            <WalletCards size={48} />
                            <p style={{ maxWidth: 520, margin: '0 auto' }}>
                                Aqui puedes vigilar en tiempo real el libro mayor (movimientos) de la Tribu Card de todos los usuarios.
                            </p>
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => cargarTribuCard({ page: 0 })}
                                className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                <WalletCards size={16} /> Cargar movimientos
                            </motion.button>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                                {[{
                                    label: 'Movimientos (24h)',
                                    value: tribuCardResumen?.movimientos24h ?? '—',
                                    color: '#3b82f6'
                                }, {
                                    label: 'Pendientes de liberar',
                                    value: tribuCardResumen?.pendientesDeLiberar ?? '—',
                                    color: '#f59e0b'
                                }, {
                                    label: 'Cashback (CLEARED)',
                                    value: formatCOP(tribuCardResumen?.clearedCashback ?? 0),
                                    color: '#22c55e'
                                }, {
                                    label: 'Compras (CLEARED)',
                                    value: formatCOP(Math.abs(tribuCardResumen?.clearedCompra ?? 0)),
                                    color: '#ef4444'
                                }].map(s => (
                                    <div key={s.label} className="card" style={{ padding: '1rem', borderColor: `${s.color}33` }}>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                                        <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 900, fontSize: '1.4rem', color: s.color }}>{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Usuario</th>
                                            <th>Tipo</th>
                                            <th>Estado</th>
                                            <th>Monto</th>
                                            <th>Pedido</th>
                                            <th>Descripcion</th>
                                            <th>Unlock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tribuCardLoading ? (
                                            <tr><td colSpan={8} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando...</td></tr>
                                        ) : (tribuCardMovs.items || []).length === 0 ? (
                                            <tr><td colSpan={8} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Sin movimientos con esos filtros</td></tr>
                                        ) : (tribuCardMovs.items || []).map(m => {
                                            const isNeg = Number(m.monto || 0) < 0
                                            const montoColor = isNeg ? '#ef4444' : '#22c55e'
                                            const ms = m?.fecha ? new Date(m.fecha).getTime() : 0
                                            const isNew = tribuCardHighlightAfterMs > 0 && Number.isFinite(ms) && ms > tribuCardHighlightAfterMs
                                            return (
                                                <tr key={m.id} style={isNew ? { background: 'rgba(34,197,94,0.06)' } : undefined}>
                                                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                        {m.fecha ? new Date(m.fecha).toLocaleString('es-CO') : '—'}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700 }}>{m.usuarioNombre || '—'}</div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{m.usuarioEmail || '—'}</div>
                                                    </td>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{m.tipo}</td>
                                                    <td>
                                                        <span className="badge" style={{
                                                            background: m.estado === 'CLEARED' ? 'rgba(0,200,150,0.12)'
                                                                : m.estado === 'ON_HOLD' ? 'rgba(254,231,21,0.12)'
                                                                    : m.estado === 'PENDING' ? 'rgba(59,130,246,0.12)'
                                                                        : 'rgba(239,68,68,0.12)',
                                                            color: m.estado === 'CLEARED' ? '#00C896'
                                                                : m.estado === 'ON_HOLD' ? '#F5D800'
                                                                    : m.estado === 'PENDING' ? '#3b82f6'
                                                                        : '#ef4444',
                                                            border: '1px solid rgba(255,255,255,0.06)'
                                                        }}>
                                                            {m.estado}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: 900, color: montoColor, whiteSpace: 'nowrap' }}>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                                            {isNeg ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                                            {formatCOP(Math.abs(Number(m.monto || 0)))}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                                                        {m.pedidoId ? `#${m.pedidoId}` : '—'}
                                                    </td>
                                                    <td style={{ maxWidth: 360 }}>
                                                        <div style={{ fontSize: '0.85rem' }}>{m.descripcion || '—'}</div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Mov #{m.id} · U#{m.usuarioId} · {m.usuarioCiudad || '—'}</div>
                                                    </td>
                                                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                        {m.unlockDate ? new Date(m.unlockDate).toLocaleString('es-CO') : '—'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    {tribuCardMovs.totalElements ? `${tribuCardMovs.totalElements} movimientos` : '—'}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-ghost"
                                        disabled={tribuCardLoading || tribuCardMovs.page <= 0}
                                        onClick={() => cargarTribuCard({ page: Math.max(0, (tribuCardMovs.page || 0) - 1) })}
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        className="btn btn-ghost"
                                        disabled={tribuCardLoading || (tribuCardMovs.page + 1) >= (tribuCardMovs.totalPages || 0)}
                                        onClick={() => cargarTribuCard({ page: (tribuCardMovs.page || 0) + 1 })}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {/* ═══ TAB: STOCK CRÍTICO ══════════════════════════════════════════════ */}
            {viewMode === 'operaciones' && tab === 'stock' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {stockBajoView.length === 0 ? (
                        <div className="empty-state"><Check size={48} style={{ color: 'var(--color-success)' }} /><p>¡Todo el stock está OK!</p></div>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead><tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Precio</th><th>Acción</th></tr></thead>
                            <tbody>
                                    {stockBajoView.map(p => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                                            <td style={{ color: 'var(--color-text-muted)' }}>{p.categoriaNombre}</td>
                                            <td><span style={{ color: '#ef4444', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangle size={13} />{p.stock}</span></td>
                                            <td style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{formatCOP(p.precio)}</td>
                                            <td>
                                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                    onClick={() => setModalProd(p)}
                                                    className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>
                                                    <Pencil size={13} /> Editar stock
                                                </motion.button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ═══ TAB: SEGURIDAD ══════════════════════════════════════════════ */}
            {viewMode === 'operaciones' && tab === 'seguridad' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldAlert size={24} color="#ef4444" />
                        Centro de Monitoreo & Ciberseguridad
                    </h2>
                    {accesos.length === 0 ? (
                        <div className="empty-state">
                            <ShieldAlert size={48} style={{ color: '#ef4444', opacity: 0.5 }} />
                            <p>No hay registros de acceso todavía.</p>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Fecha / Hora</th>
                                        <th>Usuario (Email)</th>
                                        <th>Dirección IP</th>
                                        <th>Estado</th>
                                        <th>Detalle / Error</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accesos.map((a, i) => (
                                        <tr key={a.id || i} style={{ background: !a.exitoso ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                {new Date(a.fecha).toLocaleString('es-CO')}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{a.email}</td>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>{a.ipAddress}</td>
                                            <td>
                                                <span style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    background: a.exitoso ? 'rgba(0, 200, 150, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                    color: a.exitoso ? '#00C896' : '#ef4444'
                                                }}>
                                                    {a.exitoso ? 'EXITOSO' : 'FALLIDO'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '300px' }}>
                                                {a.motivoFallo || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ═══ TAB: SOPORTE EN VIVO ══════════════════════════════════════════════ */}
            {viewMode === 'operaciones' && tab === 'soporte' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: 'calc(100vh - 240px)', minHeight: '600px' }}>
                    <div style={{
                        display: 'flex',
                        gap: '1.5rem',
                        height: '100%',
                        background: 'rgba(255, 255, 255, 0.02)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '16px',
                        padding: '1rem',
                        overflow: 'hidden'
                    }}>
                        {/* Panel Izquierdo: Lista de Chats */}
                        <div style={{
                            width: '340px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                            paddingRight: '1rem',
                            height: '100%'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MessageSquare size={18} color="var(--color-primary)" />
                                    Cola de Soporte
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    Chats activos y escalados en tiempo real
                                </p>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Buscar por usuario o pedido..."
                                    value={soporteFiltroQ}
                                    onChange={e => setSoporteFiltroQ(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem 2.2rem 0.6rem 1rem',
                                        background: 'rgba(0, 0, 0, 0.25)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '0.85rem'
                                    }}
                                />
                                <Search size={15} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            </div>

                            {/* Listado de Conversaciones */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                paddingRight: '0.25rem'
                            }}>
                                {soporteChats.filter(chat => {
                                    const username = chat.usuarioNombreCompleto || '';
                                    const useremail = chat.usuarioEmail || '';
                                    const pedidoStr = chat.pedidoId ? `pedido #${chat.pedidoId}` : '';
                                    const statusStr = chat.estado || '';
                                    return [username, useremail, pedidoStr, statusStr].some(v => v.toLowerCase().includes(soporteFiltroQ.toLowerCase()));
                                }).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                        No se encontraron conversaciones.
                                    </div>
                                ) : (
                                    soporteChats.filter(chat => {
                                        const username = chat.usuarioNombreCompleto || '';
                                        const useremail = chat.usuarioEmail || '';
                                        const pedidoStr = chat.pedidoId ? `pedido #${chat.pedidoId}` : '';
                                        const statusStr = chat.estado || '';
                                        return [username, useremail, pedidoStr, statusStr].some(v => v.toLowerCase().includes(soporteFiltroQ.toLowerCase()));
                                    }).map(chat => {
                                        const esActivo = soporteChatActivo?.id === chat.id;
                                        return (
                                            <motion.div
                                                key={chat.id}
                                                whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.05)' }}
                                                onClick={() => handleSelectConversacion(chat)}
                                                style={{
                                                    padding: '0.85rem',
                                                    borderRadius: '10px',
                                                    background: esActivo ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                                                    border: esActivo ? '1px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.04)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.5rem',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: esActivo ? '0 0 15px rgba(124, 58, 237, 0.15)' : 'none'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                                                        {chat.usuarioNombreCompleto || 'Usuario sin Nombre'}
                                                    </span>
                                                    <span style={{
                                                        padding: '0.15rem 0.4rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 'bold',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.2rem',
                                                        background: chat.estado === 'ACTIVA_IA' ? 'rgba(167, 139, 250, 0.15)' : chat.estado === 'ESCALADA_HUMANO' ? 'rgba(249, 115, 22, 0.18)' : 'rgba(16, 185, 129, 0.15)',
                                                        color: chat.estado === 'ACTIVA_IA' ? '#c084fc' : chat.estado === 'ESCALADA_HUMANO' ? '#fb923c' : '#34d399',
                                                        border: `1px solid ${chat.estado === 'ACTIVA_IA' ? 'rgba(167, 139, 250, 0.3)' : chat.estado === 'ESCALADA_HUMANO' ? 'rgba(249, 115, 22, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`
                                                    }}>
                                                        {chat.estado === 'ACTIVA_IA' ? '🤖 IA' : chat.estado === 'ESCALADA_HUMANO' ? '🚨 Agente' : '✔️ Cerrado'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {chat.usuarioEmail}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                                                    {chat.pedidoId ? (
                                                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px', color: 'var(--color-primary)', fontWeight: 600 }}>
                                                            📦 Pedido #{chat.pedidoId}
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>Sin pedido vinculado</span>
                                                    )}
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>
                                                        {chat.fechaActualizacion ? new Date(chat.fechaActualizacion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Panel Derecho: Mensajes */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            justifyContent: 'space-between'
                        }}>
                            {!soporteChatActivo ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flex: 1,
                                    color: 'var(--color-text-muted)',
                                    textAlign: 'center',
                                    padding: '2rem',
                                    gap: '1rem'
                                }}>
                                    <motion.div
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                                        style={{
                                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                                            padding: '1.25rem',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)'
                                        }}
                                    >
                                        <MessageSquare size={38} color="#fff" />
                                    </motion.div>
                                    <h4 style={{ fontWeight: 800, color: '#fff', fontSize: '1.2rem', marginTop: '0.5rem' }}>Consola de Atención al Cliente</h4>
                                    <p style={{ maxWidth: '380px', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                        Selecciona una conversación del listado lateral para ver el historial completo, interactuar con el cliente o tomar el control del asistente virtual.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                                    {/* Cabecera del Chat Activo */}
                                    <div style={{
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255,255,255,0.01)',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <h4 style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
                                                    {soporteChatActivo.usuarioNombreCompleto || 'Cliente'}
                                                </h4>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.1rem 0.35rem',
                                                    background: 'rgba(255,255,255,0.08)',
                                                    borderRadius: '4px',
                                                    color: 'var(--color-primary)'
                                                }}>ID #{soporteChatActivo.id}</span>
                                            </div>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                                {soporteChatActivo.usuarioEmail}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {soporteChatActivo.estado !== 'RESUELTA' && (
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={handleResolverConversacion}
                                                    className="btn btn-ghost"
                                                    style={{
                                                        fontSize: '0.8rem',
                                                        padding: '0.4rem 0.8rem',
                                                        border: '1px solid rgba(16, 185, 129, 0.4)',
                                                        color: '#34d399',
                                                        borderRadius: '8px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem'
                                                    }}
                                                >
                                                    <Check size={14} />
                                                    Resolver Ticket
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subcabecera: Información Detallada del Pedido Vinculado */}
                                    {soporteChatActivo.pedidoId && (
                                        <div style={{
                                            background: 'rgba(124, 58, 237, 0.04)',
                                            borderBottom: '1px solid rgba(124, 58, 237, 0.1)',
                                            padding: '0.6rem 1rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '0.82rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc' }}>
                                                <ShoppingBag size={14} />
                                                <strong>Contexto de Transacción: Pedido #{soporteChatActivo.pedidoId}</strong>
                                            </div>
                                            {pedidos.find(p => p.id === soporteChatActivo.pedidoId) && (
                                                <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-muted)' }}>
                                                    <span>Monto: <strong style={{ color: '#fff' }}>{formatCOP(pedidos.find(p => p.id === soporteChatActivo.pedidoId).total)}</strong></span>
                                                    <span>Estado: <strong style={{
                                                        color: pedidos.find(p => p.id === soporteChatActivo.pedidoId).estado === 'ENTREGADO' ? '#34d399' : '#fb923c'
                                                    }}>{pedidos.find(p => p.id === soporteChatActivo.pedidoId).estado}</strong></span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Zona de Mensajes */}
                                    <div style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        padding: '1rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                        maxHeight: '400px',
                                        minHeight: '280px',
                                        background: 'rgba(0,0,0,0.1)'
                                    }}>
                                        {soporteCargandoChat ? (
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                <div className="spinner" style={{ borderTopColor: 'var(--color-primary)' }}></div>
                                            </div>
                                        ) : soporteMensajes.length === 0 ? (
                                            <div style={{ textAlign: 'center', color: 'var(--color-text-faint)', fontSize: '0.85rem', marginTop: '2rem' }}>
                                                No hay mensajes en esta conversación.
                                            </div>
                                        ) : (
                                            soporteMensajes.map((msg, i) => {
                                                const esUsuario = msg.remitente === 'USUARIO';
                                                const esIA = msg.remitente === 'IA';
                                                const esAdmin = msg.remitente === 'ADMIN';

                                                let alignment = 'flex-start';
                                                let bubbleBg = 'rgba(255, 255, 255, 0.05)';
                                                let bubbleColor = '#fff';
                                                let bubbleBorder = '1px solid rgba(255,255,255,0.06)';
                                                let label = 'Cliente';

                                                if (esUsuario) {
                                                    alignment = 'flex-start';
                                                    bubbleBg = 'rgba(255, 255, 255, 0.04)';
                                                } else if (esIA) {
                                                    alignment = 'flex-end';
                                                    bubbleBg = 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(79, 70, 229, 0.25))';
                                                    bubbleBorder = '1px solid rgba(124, 58, 237, 0.35)';
                                                    label = 'Asistente Virtual 🤖';
                                                } else if (esAdmin) {
                                                    alignment = 'flex-end';
                                                    bubbleBg = 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(234, 88, 12, 0.25))';
                                                    bubbleBorder = '1px solid rgba(249, 115, 22, 0.4)';
                                                    label = 'Soporte Humano 🧑‍💻';
                                                } else {
                                                    // Sistema
                                                    alignment = 'center';
                                                    bubbleBg = 'rgba(255, 255, 255, 0.02)';
                                                    bubbleColor = 'var(--color-text-muted)';
                                                    label = 'Sistema';
                                                }

                                                return (
                                                    <div key={msg.id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: alignment === 'flex-start' ? 'flex-start' : alignment === 'flex-end' ? 'flex-end' : 'center', width: '100%' }}>
                                                        <div style={{
                                                            maxWidth: '75%',
                                                            padding: '0.75rem 1rem',
                                                            borderRadius: esUsuario ? '12px 12px 12px 4px' : esIA || esAdmin ? '12px 12px 4px 12px' : '8px',
                                                            background: bubbleBg,
                                                            border: bubbleBorder,
                                                            color: bubbleColor,
                                                            fontSize: '0.85rem',
                                                            lineHeight: 1.4,
                                                            wordBreak: 'break-word',
                                                            whiteSpace: 'pre-wrap',
                                                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                                        }}>
                                                            {msg.contenido}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.7rem',
                                                            color: 'var(--color-text-faint)',
                                                            marginTop: '0.2rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem'
                                                        }}>
                                                            <span style={{ fontWeight: 600 }}>{label}</span>
                                                            <span>•</span>
                                                            <span>{msg.fechaCreacion ? new Date(msg.fechaCreacion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                                            {msg.sentiment && msg.sentiment !== 'NEUTRAL' && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span style={{ color: msg.sentiment === 'FRUSTRADO' ? '#ef4444' : '#34d399', textTransform: 'lowercase', fontSize: '0.65rem' }}>{msg.sentiment}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={soporteMessagesEndRef} />
                                    </div>

                                    {/* Formulario de Entrada */}
                                    <div style={{
                                        padding: '0.75rem 1rem 0 1rem',
                                        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}>
                                        {soporteChatActivo.estado === 'RESUELTA' ? (
                                            <div style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'rgba(16, 185, 129, 0.1)',
                                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                                borderRadius: '8px',
                                                color: '#34d399',
                                                textAlign: 'center',
                                                fontSize: '0.85rem',
                                                fontWeight: 600
                                            }}>
                                                Este ticket ya fue resuelto. Envía un mensaje si deseas reabrirlo.
                                            </div>
                                        ) : null}

                                        {soporteChatActivo.estado !== 'RESUELTA' && (
                                            <form onSubmit={handleEnviarMensajeAdmin} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Escribe una respuesta para el cliente..."
                                                    value={soporteNuevoMensaje}
                                                    onChange={e => setSoporteNuevoMensaje(e.target.value)}
                                                    disabled={soporteEnviando}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.75rem 1rem',
                                                        background: 'rgba(0, 0, 0, 0.3)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '0.88rem'
                                                    }}
                                                />
                                                <motion.button
                                                    type="submit"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    disabled={soporteEnviando || !soporteNuevoMensaje.trim()}
                                                    className="btn btn-primary"
                                                    style={{
                                                        padding: '0.75rem 1.25rem',
                                                        borderRadius: '8px',
                                                        fontWeight: 800,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: '90px'
                                                    }}
                                                >
                                                    {soporteEnviando ? 'Enviando...' : 'Enviar'}
                                                </motion.button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

                    </section>
                </div>
            )}

            {/* ═══ MODAL: PRODUCTO ════════════════════════════════════════════════ */}
            <AnimatePresence>
                {modalProd !== null && (
                    <ModalProducto
                        prod={modalProd?.id ? modalProd : null}
                        categorias={categorias}
                        onClose={() => setModalProd(null)}
                        onSave={cargarDatos}
                    />
                )}
            </AnimatePresence>

            {/* ═══ MODAL: CRM NOTA ════════════════════════════════════════════════ */}
            <AnimatePresence>
                {showNotaModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowNotaModal(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
                            onClick={e => e.stopPropagation()}
                            className="card" style={{ width: '100%', maxWidth: 480, padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontWeight: 800 }}>Nueva Nota CRM</h3>
                                <button onClick={() => setShowNotaModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCrearNota}>
                                <div className="form-group">
                                    <label>Cliente</label>
                                    <select className="input" value={notaForm.clienteId}
                                        onChange={e => setNotaForm({ ...notaForm, clienteId: e.target.value })} required>
                                        <option value="">Seleccionar cliente...</option>
                                        {usuarios.filter(u => u.rol === 'CLIENTE').map(u => (
                                            <option key={u.id} value={u.id}>{u.nombreCompleto} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Nota</label>
                                    <textarea className="input" rows={4} placeholder="Escribe la nota..."
                                        value={notaForm.contenido} onChange={e => setNotaForm({ ...notaForm, contenido: e.target.value })} required
                                        style={{ resize: 'vertical', minHeight: '100px' }} />
                                </div>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    type="submit" className="btn btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontWeight: 800 }}>
                                    Guardar Nota
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: CATEGORÍA ════════════════════════════════════════════════ */}
            <AnimatePresence>
                {catModal !== null && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setCatModal(null)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                            onClick={e => e.stopPropagation()}
                            className="card" style={{ width: '100%', maxWidth: 460, padding: '2rem' }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Tag size={20} color="var(--color-primary)" />
                                    <h3 style={{ fontWeight: 800 }}>
                                        {catModal?.id ? 'Editar Categoría' : 'Nueva Categoría'}
                                    </h3>
                                </div>
                                <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => setCatModal(null)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                    <X size={20} />
                                </motion.button>
                            </div>

                            <form onSubmit={handleGuardarCat}>
                                <div className="form-group">
                                    <label>Nombre <span style={{ color: 'var(--color-primary)' }}>*</span></label>
                                    <input className="input" type="text"
                                        placeholder="Ej: Gadgets, Hogar, Moda..."
                                        value={catForm.nombre}
                                        onChange={e => setCatForm({ ...catForm, nombre: e.target.value })}
                                        required autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Descripción <span style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>(opcional)</span></label>
                                    <textarea className="input" rows={3}
                                        placeholder="Describe brevemente esta categoría..."
                                        value={catForm.descripcion}
                                        onChange={e => setCatForm({ ...catForm, descripcion: e.target.value })}
                                        style={{ resize: 'vertical', minHeight: '70px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                                    <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                                        onClick={() => setCatModal(null)}
                                        className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                                        Cancelar
                                    </motion.button>
                                    <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                                        className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', fontWeight: 800 }}>
                                        <Tag size={15} />
                                        {catModal?.id ? 'Guardar cambios' : 'Crear categoría'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
