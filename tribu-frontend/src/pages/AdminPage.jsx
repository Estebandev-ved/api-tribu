import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    getAllPedidos, actualizarEstadoPedido,
    getUsuarios, promoverAdmin, asignarCliente,
    getTodasLasNotas, crearNota,
    getStockBajo, getCategorias,
    crearProducto, actualizarProducto, eliminarProducto,
    crearCategoria, actualizarCategoria, eliminarCategoria,
    getTodasLasDevoluciones, actualizarEstadoDevolucion, reembolsarSaldoDevolucion,
    getEstadisticasDevolucion
} from '../api'
import toast from 'react-hot-toast'
import {
    Package, Users, FileText, AlertTriangle, Plus, X,
    Check, ShoppingBag, Pencil, Trash2, Image, BarChart3,
    TrendingUp, TrendingDown, User, Zap, Tag, RotateCcw
} from 'lucide-react'

const ESTADOS = ['PENDIENTE', 'PAGADO', 'ENVIADO', 'ENTREGADO']
const estadoColor = {
    PENDIENTE: 'badge-pendiente', PAGADO: 'badge-cliente',
    ENVIADO: 'badge-enviado', ENTREGADO: 'badge-entregado'
}
const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

// ─── Modal de Producto ─────────────────────────────────────────────────────────
const PRODUCTO_VACIO = { nombre: '', descripcion: '', precio: '', stock: '', esViral: false, categoriaId: '', imagenUrl: '' }

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
            const payload = { ...form, precio: Number(form.precio), stock: Number(form.stock), categoriaId: Number(form.categoriaId) }
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
    const [notas, setNotas] = useState([])
    const [stockBajo, setStockBajo] = useState([])
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [devoluciones, setDevoluciones] = useState([])
    const [statsDevoluciones, setStatsDevoluciones] = useState(null)
    const [loading, setLoading] = useState(true)

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
            getEstadisticasDevolucion().catch(() => ({ data: null }))
        ]).then(([p, u, n, s, cats, prods, devs, statsDevs]) => {
            setPedidos(p.data); setUsuarios(u.data)
            setNotas(n.data); setStockBajo(s.data)
            setCategorias(cats.data); setProductos(prods.data)
            setDevoluciones(devs.data || [])
            setStatsDevoluciones(statsDevs.data || null)
        }).finally(() => setLoading(false))
    }

    useEffect(cargarDatos, [])

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
        { id: 'productos', label: 'Productos', icon: <ShoppingBag size={15} />, count: productos.length },
        { id: 'categorias', label: 'Categorías', icon: <Tag size={15} />, count: categorias.length },
        { id: 'pedidos', label: 'Pedidos', icon: <Package size={15} />, count: pedidos.length },
        { id: 'devoluciones', label: 'Devoluciones', icon: <RotateCcw size={15} />, count: devoluciones.filter(d => d.estado === 'PENDIENTE').length },
        { id: 'usuarios', label: 'Usuarios', icon: <Users size={15} />, count: usuarios.length },
        { id: 'crm', label: 'CRM', icon: <FileText size={15} />, count: notas.length },
        { id: 'stock', label: 'Stock Crítico', icon: <AlertTriangle size={15} />, count: stockBajo.length },
    ]

    if (loading) return <div className="spinner" style={{ marginTop: '4rem' }} />

    return (
        <div className="container" style={{ padding: '2rem 1.5rem', paddingBottom: '5rem' }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="page-title">Panel de Administración</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Tribu · Mocoa, Putumayo — Gestión completa del negocio
                </p>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="admin-stats-grid"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}
            >
                {[
                    { label: 'Productos', value: productos.length, color: 'var(--color-primary)', Icon: ShoppingBag },
                    { label: 'Pedidos', value: pedidos.length, color: '#3b82f6', Icon: Package },
                    { label: 'Dev. Pdtes', value: devoluciones.filter(d => d.estado === 'PENDIENTE').length, color: '#00C896', Icon: RotateCcw },
                    { label: 'Usuarios', value: usuarios.length, color: 'var(--color-success)', Icon: Users },
                    { label: 'Stock Crítico', value: stockBajo.length, color: '#ef4444', Icon: AlertTriangle },
                ].map((s, i) => (
                    <motion.div key={s.label} className="card" whileHover={{ scale: 1.03, borderColor: s.color + '40' }}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                            <s.Icon size={24} color={s.color} strokeWidth={1.5} />
                        </div>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '2rem', color: s.color }}>{s.value}</p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{s.label}</p>
                    </motion.div>
                ))}
            </motion.div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap',
                            padding: '0.6rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer',
                            color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                            fontWeight: 600, fontSize: '0.87rem', transition: 'all 0.2s',
                        }}>
                        {t.icon} {t.label}
                        {t.count > 0 && (
                            <span style={{
                                background: tab === t.id ? 'var(--color-primary)' : 'var(--color-surface-2)',
                                color: tab === t.id ? '#fff' : 'var(--color-text-muted)',
                                borderRadius: '9999px', padding: '0 7px', fontSize: '0.7rem', fontWeight: 700,
                            }}>{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ═══ TAB: PRODUCTOS ══════════════════════════════════════════════════ */}
            {tab === 'productos' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ fontWeight: 700 }}>Catálogo ({productos.length} productos)</h2>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setModalProd({})} className="btn btn-primary">
                            <Plus size={16} /> Nuevo Producto
                        </motion.button>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead><tr>
                                <th>Imagen</th><th>Producto</th><th>Categoría</th>
                                <th>Precio</th><th>Stock</th><th>Viral</th><th>Acciones</th>
                            </tr></thead>
                            <tbody>
                                {productos.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                        No hay productos. ¡Crea el primero!
                                    </td></tr>
                                ) : productos.map(p => (
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
            {tab === 'categorias' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ fontWeight: 700 }}>Categorías ({categorias.length})</h2>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => abrirCatModal()} className="btn btn-primary">
                            <Plus size={16} /> Nueva Categoría
                        </motion.button>
                    </div>

                    {categorias.length === 0 ? (
                        <div className="empty-state">
                            <Tag size={48} style={{ opacity: 0.3 }} />
                            <p>No hay categorías todavía</p>
                            <motion.button whileHover={{ scale: 1.04 }} onClick={() => abrirCatModal()}
                                className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                <Plus size={15} /> Crear primera categoría
                            </motion.button>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead><tr>
                                    <th>#</th><th>Nombre</th><th>Descripción</th><th>Acciones</th>
                                </tr></thead>
                                <tbody>
                                    {categorias.map((cat, i) => (
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
            {tab === 'pedidos' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Gestión de Pedidos ({pedidos.length})</h2>
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>#</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Dirección</th><th>Guía</th><th>Cambiar estado</th></tr></thead>
                            <tbody>
                                {pedidos.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No hay pedidos aún</td></tr>
                                ) : pedidos.map(p => (
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

            {/* ═══ TAB: DEVOLUCIONES ═══════════════════════════════════════════════ */}
            {tab === 'devoluciones' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h2 style={{ fontWeight: 700, margin: 0 }}>Gestión de Devoluciones ({devoluciones.length})</h2>
                    </div>

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
                                {devoluciones.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No hay solicitudes de devolución</td></tr>
                                ) : devoluciones.map(d => (
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
            {tab === 'usuarios' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Usuarios registrados ({usuarios.length})</h2>
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Nombre</th><th>Email</th><th>Ciudad</th><th>Teléfono</th><th>Rol</th><th>Saldo a Favor</th><th>Acciones</th></tr></thead>
                            <tbody>
                                {usuarios.map(u => (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: 600 }}>{u.nombreCompleto}</td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{u.ciudad || '—'}</td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{u.telefono || '—'}</td>
                                        <td><span className={`badge ${u.rol === 'ADMIN' ? 'badge-admin' : 'badge-cliente'}`}>{u.rol}</span></td>
                                        <td style={{ fontWeight: 800, color: u.saldoFavor > 0 ? '#4facfe' : 'var(--color-text-muted)' }}>
                                            {formatCOP(u.saldoFavor || 0)}
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

            {/* ═══ TAB: CRM ════════════════════════════════════════════════════════ */}
            {tab === 'crm' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <h2 style={{ fontWeight: 700 }}>Notas CRM ({notas.length})</h2>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setShowNotaModal(true)} className="btn btn-primary">
                            <Plus size={15} /> Nueva Nota
                        </motion.button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {notas.map((n, i) => (
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
                        {notas.length === 0 && <div className="empty-state"><FileText size={48} /><p>No hay notas todavía</p></div>}
                    </div>
                </motion.div>
            )}

            {/* ═══ TAB: STOCK CRÍTICO ══════════════════════════════════════════════ */}
            {tab === 'stock' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Stock Crítico ≤ 5 unidades</h2>
                    {stockBajo.length === 0 ? (
                        <div className="empty-state"><Check size={48} style={{ color: 'var(--color-success)' }} /><p>¡Todo el stock está OK!</p></div>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead><tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Precio</th><th>Acción</th></tr></thead>
                                <tbody>
                                    {stockBajo.map(p => (
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
