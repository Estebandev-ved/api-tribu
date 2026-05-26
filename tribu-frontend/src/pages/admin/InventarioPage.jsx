import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, AlertTriangle, CheckCircle, Download, Search, Edit2, Save, X, 
  Filter, Boxes, TrendingDown, Coins, Percent, Scale, TrendingUp, Calendar,
  User, DollarSign, ArrowUpRight, ArrowDownRight, Settings2, FileText, Check, AlertCircle
} from 'lucide-react'
import { 
  getProductosFinancieros, getDashboardKpis, getResumenCaja, 
  getRegistroVentas, getProductosRentabilidad, api 
} from '../../api'
import { formatCOP } from '../../utils/formatters'
import Skeleton from '../../components/Skeleton'

export default function InventarioPage() {
  const [activeTab, setActiveTab] = useState('caja') // 'caja', 'rentabilidad', 'configuracion'
  
  // Data States
  const [resumenCaja, setResumenCaja] = useState({
    ingresosTotales: 0,
    egresosTotalesCogs: 0,
    utilidadNeta: 0,
    efectivoCaja: 0,
    dineroPendiente: 0,
    totalVentas: 0,
    totalItemsVendidos: 0
  })
  const [registroVentas, setRegistroVentas] = useState([])
  const [productosRentabilidad, setProductosRentabilidad] = useState([])
  const [productosFinancieros, setProductosFinancieros] = useState([]) // For configuration tab
  
  // General UI States
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRentabilidad, setFiltroRentabilidad] = useState('todos') // 'todos', 'excelente', 'moderado', 'critico'
  
  // Editing State for Manual Cost Configuration
  const [editandoId, setEditandoId] = useState(null)
  const [valoresEdit, setValoresEdit] = useState({
    precio: 0,
    stock: 0,
    costoProveedor: 0,
    costoEmpaqueEnvio: 0,
    comisionPasarelaFija: 0
  })

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000)
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'caja') {
        const [cajaRes, ventasRes] = await Promise.all([
          getResumenCaja(),
          getRegistroVentas()
        ])
        setResumenCaja(cajaRes.data || {
          ingresosTotales: 0,
          egresosTotalesCogs: 0,
          utilidadNeta: 0,
          efectivoCaja: 0,
          dineroPendiente: 0,
          totalVentas: 0,
          totalItemsVendidos: 0
        })
        setRegistroVentas(ventasRes.data || [])
      } else if (activeTab === 'rentabilidad') {
        const rentRes = await getProductosRentabilidad()
        setProductosRentabilidad(rentRes.data || [])
      } else if (activeTab === 'configuracion') {
        const prodsRes = await getProductosFinancieros()
        setProductosFinancieros(prodsRes.data || [])
      }
    } catch (err) {
      console.error('Error cargando datos financieros:', err)
      showToast('Error al conectar con la base de datos financiera', 'error')
    } finally {
      setLoading(false)
    }
  }

  const iniciarEdicion = (prod) => {
    setEditandoId(prod.id)
    setValoresEdit({
      precio: prod.precio || 0,
      stock: prod.stock || 0,
      costoProveedor: prod.costoProveedor || 0,
      costoEmpaqueEnvio: prod.costoEmpaqueEnvio || 0,
      comisionPasarelaFija: prod.comisionPasarelaFija || 0
    })
  }

  const guardarConfiguracionManual = async (prod) => {
    try {
      // 1. Guardamos la información completa en el backend a través del endpoint de actualización de producto
      await api.put(`/productos/${prod.id}`, {
        nombre: prod.nombre,
        descripcion: prod.descripcion || '',
        precio: Number(valoresEdit.precio),
        stock: Number(valoresEdit.stock),
        categoriaId: prod.categoriaId,
        costoProveedor: Number(valoresEdit.costoProveedor),
        costoEmpaqueEnvio: Number(valoresEdit.costoEmpaqueEnvio),
        comisionPasarelaFija: Number(valoresEdit.comisionPasarelaFija)
      })

      showToast(`¡Configuración de ${prod.nombre} guardada con éxito!`, 'success')
      setEditandoId(null)
      fetchData()
    } catch (err) {
      console.error('Error actualizando costos manualmente:', err)
      showToast('Error al guardar la configuración del producto', 'error')
    }
  }

  // Filtrado de Ventas
  const ventasFiltradas = registroVentas.filter(v => 
    v.producto.toLowerCase().includes(busqueda.toLowerCase()) || 
    (v.cliente && v.cliente.toLowerCase().includes(busqueda.toLowerCase()))
  )

  // Filtrado de Rentabilidad
  const rentabilidadFiltrada = productosRentabilidad.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    if (filtroRentabilidad === 'todos') return coincideBusqueda
    return coincideBusqueda && p.semaforoRendimiento.toLowerCase() === filtroRentabilidad
  })

  // Filtrado de Configuración
  const configuracionFiltrada = productosFinancieros.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const exportarCSV = () => {
    let headers = []
    let rows = []
    let filename = ''

    if (activeTab === 'caja') {
      headers = ['ID Pedido', 'Fecha', 'Producto', 'Cantidad', 'Precio Unitario', 'Ingreso Total', 'Costo Unitario (COGS)', 'Costo Total', 'Utilidad Neta', 'Cliente']
      rows = registroVentas.map(v => [
        v.pedidoId,
        new Date(v.fecha).toLocaleDateString(),
        v.producto,
        v.cantidad,
        v.precioUnitario,
        v.ingresoTotal,
        v.costoUnitario,
        v.costoTotal,
        v.utilidadNeta,
        v.cliente
      ])
      filename = `Libro_Diario_Ventas_${new Date().toISOString().split('T')[0]}.csv`
    } else if (activeTab === 'rentabilidad') {
      headers = ['Producto', 'Categoría', 'PVP Venta', 'Costo COGS Unitario', 'Margen Unitario (MCU)', 'Margen %', 'Unidades Vendidas', 'Utilidad Total Acumulada', 'Rendimiento']
      rows = productosRentabilidad.map(p => [
        p.nombre,
        p.categoriaNombre,
        p.precioVenta,
        p.costoUnitarioTotal,
        p.margenUnitario,
        p.margenPorcentaje,
        p.unidadesVendidas,
        p.utilidadTotalGenerada,
        p.semaforoRendimiento
      ])
      filename = `Rentabilidad_Productos_${new Date().toISOString().split('T')[0]}.csv`
    } else {
      headers = ['Producto', 'Categoría', 'PVP Venta', 'Stock', 'Costo Proveedor', 'Costo Envío', 'Comisión Fija']
      rows = productosFinancieros.map(p => [
        p.nombre,
        p.categoriaNombre,
        p.precio,
        p.stock,
        p.costoProveedor,
        p.costoEmpaqueEnvio,
        p.comisionPasarelaFija
      ])
      filename = `Catalogo_Costos_Configuracion_${new Date().toISOString().split('T')[0]}.csv`
    }

    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Archivo CSV exportado exitosamente')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 10% -10%, #1a1a1c 0%, #0d0d0f 50%, #050505 100%)',
      paddingTop: '6rem',
      paddingBottom: '4rem',
      color: '#fff',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              background: toast.type === 'success' ? '#10B981' : '#EF4444',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Cabecera Principal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#ff7a45', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
              Panel Financiero & Margen de Contribución
            </p>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Scale size={32} color="#ff7a45" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 122, 69, 0.4))' }} />
              Finanzas & Inventario
            </h1>
            <p style={{ color: '#888990', margin: 0, fontSize: '0.95rem' }}>
              Control contable, auditoría del Libro Diario y análisis de rendimiento por SKU en tiempo real.
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 4px 15px rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.98 }}
            onClick={exportarCSV}
            style={{
              padding: '0.7rem 1.2rem',
              background: 'rgba(255, 255, 255, 0.03)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.88rem',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Download size={16} color="#ff7a45" />
            Exportar datos (CSV)
          </motion.button>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS (TABS) */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          marginBottom: '2.5rem',
          backdropFilter: 'blur(20px)',
          width: 'fit-content'
        }}>
          {[
            { id: 'caja', label: 'Caja y Libro Diario', icon: Coins },
            { id: 'rentabilidad', label: 'Rentabilidad de Productos', icon: TrendingUp },
            { id: 'configuracion', label: 'Configuración Rápida', icon: Settings2 }
          ].map(tab => {
            const IconComponent = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setBusqueda('')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.8rem 1.4rem',
                  border: 'none',
                  borderRadius: '12px',
                  background: active ? 'linear-gradient(135deg, #ff7a45 0%, #d4380d 100%)' : 'transparent',
                  color: active ? '#fff' : '#888990',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: '0.9rem',
                  boxShadow: active ? '0 4px 15px rgba(255, 122, 69, 0.3)' : 'none'
                }}
              >
                <IconComponent size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* CARGANDO (SKELETON) */}
        {loading ? (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <Skeleton height="120px" borderRadius="16px" />
            <Skeleton height="400px" borderRadius="16px" />
          </div>
        ) : (
          <>
            {/* PESTAÑA 1: CAJA Y LIBRO DIARIO */}
            {activeTab === 'caja' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                
                {/* Cuadrícula de KPIs Financieros */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                  
                  {/* KPI: Ingresos Totales */}
                  <div className="card" style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.03) 0%, rgba(34,197,94,0.01) 100%)',
                    border: '1px solid rgba(34,197,94,0.15)',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '120px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ color: '#888990', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                          Ingresos Totales (Ventas)
                        </p>
                        <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#22c55e', marginTop: '0.4rem' }}>
                          {formatCOP(resumenCaja.ingresosTotales)}
                        </p>
                      </div>
                      <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                        <ArrowUpRight size={20} />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#686970', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={12} /> {resumenCaja.totalVentas} transacciones liquidadas
                    </p>
                  </div>

                  {/* KPI: Egresos Totales COGS */}
                  <div className="card" style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.03) 0%, rgba(239,68,68,0.01) 100%)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '120px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ color: '#888990', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                          Egresos Totales (COGS)
                        </p>
                        <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444', marginTop: '0.4rem' }}>
                          {formatCOP(resumenCaja.egresosTotalesCogs)}
                        </p>
                      </div>
                      <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        <ArrowDownRight size={20} />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#686970', margin: 0 }}>
                      Costo total de mercancías vendidas
                    </p>
                  </div>

                  {/* KPI: Utilidad Neta */}
                  <div className="card" style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.04) 0%, rgba(168,85,247,0.01) 100%)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '120px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ color: '#888990', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                          Utilidad Neta Directa
                        </p>
                        <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#a855f7', marginTop: '0.4rem' }}>
                          {formatCOP(resumenCaja.utilidadNeta)}
                        </p>
                      </div>
                      <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                        <TrendingUp size={20} />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#686970', margin: 0 }}>
                      Rendimiento real antes de impuestos
                    </p>
                  </div>

                  {/* KPI: Efectivo en Caja (Dinero Realizado) */}
                  <div className="card" style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.03) 0%, rgba(59,130,246,0.01) 100%)',
                    border: '1px solid rgba(59,130,246,0.15)',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '120px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ color: '#888990', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                          Efectivo Caja (Web)
                        </p>
                        <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#3b82f6', marginTop: '0.4rem' }}>
                          {formatCOP(resumenCaja.efectivoCaja)}
                        </p>
                      </div>
                      <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                        <Coins size={20} />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#686970', margin: 0 }}>
                      Dinero neto en pasarela / cuentas
                    </p>
                  </div>

                  {/* KPI: Dinero Pendiente */}
                  <div className="card" style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(234,179,8,0.03) 0%, rgba(234,179,8,0.01) 100%)',
                    border: '1px solid rgba(234,179,8,0.15)',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '120px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ color: '#888990', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                          Dinero Pendiente
                        </p>
                        <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#eab308', marginTop: '0.4rem' }}>
                          {formatCOP(resumenCaja.dineroPendiente)}
                        </p>
                      </div>
                      <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(234,179,8,0.1)', color: '#eab308' }}>
                        <AlertCircle size={20} />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#686970', margin: 0 }}>
                      Pedidos pendientes de aprobación/pago
                    </p>
                  </div>

                </div>

                {/* Libro Diario de Ventas */}
                <div className="card" style={{
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '24px',
                  padding: '2rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={20} color="#ff7a45" />
                        Registro de Ventas Automático (Libro Diario)
                      </h3>
                      <p style={{ color: '#888990', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                        Todas las ventas individuales detalladas con PVP, Costo COGS y Utilidad Neta generada.
                      </p>
                    </div>

                    {/* Barra de Búsqueda */}
                    <div style={{ position: 'relative', width: '280px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#686970' }} />
                      <input
                        type="text"
                        placeholder="Buscar por producto o cliente..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 1rem 0.6rem 2.2rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Tabla del Libro Diario */}
                  {ventasFiltradas.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#686970' }}>
                      <Coins size={36} style={{ marginBottom: '10px', color: '#444' }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>No hay transacciones registradas</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#555' }}>
                        Los datos se auto-completarán cuando se realicen compras de catálogo.
                      </p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#888990' }}>
                            <th style={{ padding: '12px', fontWeight: 600 }}>Fecha</th>
                            <th style={{ padding: '12px', fontWeight: 600 }}>Ref Pedido</th>
                            <th style={{ padding: '12px', fontWeight: 600 }}>Cliente</th>
                            <th style={{ padding: '12px', fontWeight: 600 }}>Producto</th>
                            <th style={{ padding: '12px', fontWeight: 600, textAlign: 'center' }}>Cant</th>
                            <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>PVP Unit</th>
                            <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Ingreso Total</th>
                            <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>COGS Unit</th>
                            <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Costo Total</th>
                            <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Utilidad Neta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ventasFiltradas.map((v) => {
                            const isPositive = Number(v.utilidadNeta) > 0
                            return (
                              <tr 
                                key={v.id} 
                                style={{ 
                                  borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                                  transition: 'background 0.2s',
                                  cursor: 'default'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <td style={{ padding: '14px 12px', whiteSpace: 'nowrap', color: '#c8c9d0' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Calendar size={14} color="#ff7a45" />
                                    {new Date(v.fecha).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>
                                <td style={{ padding: '14px 12px', fontWeight: 700, color: '#ff7a45' }}>
                                  #{v.pedidoId}
                                </td>
                                <td style={{ padding: '14px 12px', color: '#c8c9d0' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <User size={13} color="#888990" />
                                    {v.cliente}
                                  </div>
                                </td>
                                <td style={{ padding: '14px 12px', fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {v.imagenUrl && (
                                      <img 
                                        src={v.imagenUrl} 
                                        alt={v.producto} 
                                        style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.05)' }} 
                                      />
                                    )}
                                    {v.producto}
                                  </div>
                                </td>
                                <td style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, color: '#fff' }}>
                                  {v.cantidad}
                                </td>
                                <td style={{ padding: '14px 12px', textAlign: 'right', color: '#c8c9d0' }}>
                                  {formatCOP(v.precioUnitario)}
                                </td>
                                <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                                  {formatCOP(v.ingresoTotal)}
                                </td>
                                <td style={{ padding: '14px 12px', textAlign: 'right', color: '#888990' }}>
                                  {formatCOP(v.costoUnitario)}
                                </td>
                                <td style={{ padding: '14px 12px', textAlign: 'right', color: '#888990' }}>
                                  {formatCOP(v.costoTotal)}
                                </td>
                                <td style={{ 
                                  padding: '14px 12px', 
                                  textAlign: 'right', 
                                  fontWeight: 800, 
                                  color: isPositive ? '#22c55e' : '#ef4444' 
                                }}>
                                  {formatCOP(v.utilidadNeta)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* PESTAÑA 2: RENTABILIDAD DE PRODUCTOS */}
            {activeTab === 'rentabilidad' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                
                {/* Filtros de Rendimiento */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'todos', label: 'Todos los productos', count: productosRentabilidad.length, color: '#fff' },
                    { id: 'excelente', label: '🟢 Margen Excelente (>60%)', count: productosRentabilidad.filter(p => p.semaforoRendimiento === 'EXCELENTE').length, color: '#22c55e' },
                    { id: 'moderado', label: '🟡 Margen Moderado (40%-60%)', count: productosRentabilidad.filter(p => p.semaforoRendimiento === 'MODERADO').length, color: '#eab308' },
                    { id: 'critico', label: '🔴 Margen Crítico (<40%)', count: productosRentabilidad.filter(p => p.semaforoRendimiento === 'CRITICO').length, color: '#ef4444' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFiltroRentabilidad(f.id)}
                      style={{
                        padding: '0.6rem 1rem',
                        background: filtroRentabilidad === f.id ? `${f.color}15` : 'rgba(255, 255, 255, 0.01)',
                        border: `1px solid ${filtroRentabilidad === f.id ? f.color : 'rgba(255, 255, 255, 0.05)'}`,
                        borderRadius: '12px',
                        color: filtroRentabilidad === f.id ? f.color : '#888990',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {f.label}
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: filtroRentabilidad === f.id ? f.color : 'rgba(255, 255, 255, 0.04)',
                        color: filtroRentabilidad === f.id ? '#000' : '#888990',
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Tabla de Rentabilidad */}
                <div className="card" style={{
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '24px',
                  padding: '2rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingUp size={20} color="#ff7a45" />
                        Análisis Unitario y Rendimiento Acumulado (COGS vs PVP)
                      </h3>
                      <p style={{ color: '#888990', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                        Estudio detallado de la rentabilidad porcentual de cada producto y sus ingresos/utilidades acumulados en ventas.
                      </p>
                    </div>

                    <div style={{ position: 'relative', width: '280px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#686970' }} />
                      <input
                        type="text"
                        placeholder="Filtrar por nombre de producto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 1rem 0.6rem 2.2rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {rentabilidadFiltrada.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#686970' }}>
                      <Package size={36} style={{ marginBottom: '10px', color: '#444' }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>Ningún producto coincide con el filtro</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#888990' }}>
                            <th style={{ padding: '12px', fontWeight: 600 }}>Producto</th>
                            <th style={{ padding: '12px', fontWeight: 600 }}>Categoría</th>
                            <th style={{ padding: '12px', fontWeight: 600, textAlign: 'center' }}>Stock</th>
                            <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>PVP Venta</th>
                            <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Costo COGS</th>
                            <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Margen Unit (MCU)</th>
                            <th style={{ padding: '12px', fontWeight: 600, textAlign: 'center' }}>Margen %</th>
                            <th style={{ padding: '12px', fontWeight: 600, textAlign: 'center' }}>Vendidos</th>
                            <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Utilidad Acum.</th>
                            <th style={{ padding: '12px', fontWeight: 600, textAlign: 'center' }}>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rentabilidadFiltrada.map((p) => {
                            const isExcellent = p.semaforoRendimiento === 'EXCELENTE'
                            const isModerate = p.semaforoRendimiento === 'MODERADO'
                            const color = isExcellent ? '#22c55e' : isModerate ? '#eab308' : '#ef4444'
                            const bg = isExcellent ? 'rgba(34,197,94,0.06)' : isModerate ? 'rgba(234,179,8,0.06)' : 'rgba(239,68,68,0.06)'
                            
                            return (
                              <tr 
                                key={p.id} 
                                style={{ 
                                  borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <td style={{ padding: '14px 12px', fontWeight: 600 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {p.imagenUrl && (
                                      <img 
                                        src={p.imagenUrl} 
                                        alt={p.nombre} 
                                        style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.05)' }} 
                                      />
                                    )}
                                    {p.nombre}
                                  </div>
                                </td>
                                <td style={{ padding: '14px 12px', color: '#c8c9d0' }}>
                                  {p.categoriaNombre}
                                </td>
                                <td style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, color: p.stock === 0 ? '#ef4444' : '#fff' }}>
                                  {p.stock === 0 ? 'Agotado' : p.stock}
                                </td>
                                <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, color: '#fff' }}>
                                  {formatCOP(p.precioVenta)}
                                </td>
                                <td style={{ padding: '14px 12px', textAlign: 'right', color: '#888990' }}>
                                  {formatCOP(p.costoUnitarioTotal)}
                                </td>
                                <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, color: color }}>
                                  {formatCOP(p.margenUnitario)}
                                </td>
                                <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                                  <span style={{ 
                                    padding: '4px 8px', 
                                    borderRadius: '8px', 
                                    background: bg, 
                                    color: color, 
                                    fontWeight: 800,
                                    fontSize: '0.8rem'
                                  }}>
                                    {p.margenPorcentaje}%
                                  </span>
                                </td>
                                <td style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 800, color: '#fff' }}>
                                  {p.unidadesVendidas}
                                </td>
                                <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 800, color: '#fff' }}>
                                  {formatCOP(p.utilidadTotalGenerada)}
                                </td>
                                <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                                  <span style={{ 
                                    padding: '3px 7px', 
                                    borderRadius: '6px', 
                                    background: 'rgba(255,255,255,0.03)', 
                                    color: color, 
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    border: `1px solid ${color}20`
                                  }}>
                                    {p.semaforoRendimiento}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* PESTAÑA 3: CONFIGURACIÓN RÁPIDA (EDICIÓN MANUAL DE COSTOS) */}
            {activeTab === 'configuracion' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                
                <div className="card" style={{
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '24px',
                  padding: '2rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Settings2 size={20} color="#ff7a45" />
                        Gestión Manual de Catálogo Financiero
                      </h3>
                      <p style={{ color: '#888990', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                        Modifica en un solo clic los precios de venta, stock disponible y desglose de costos (Proveedor, Envío y Comisión Pasarela).
                      </p>
                    </div>

                    <div style={{ position: 'relative', width: '280px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#686970' }} />
                      <input
                        type="text"
                        placeholder="Buscar producto por nombre..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 1rem 0.6rem 2.2rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {configuracionFiltrada.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#686970' }}>
                      <Package size={36} style={{ marginBottom: '10px', color: '#444' }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>Ningún producto disponible para configurar</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#888990' }}>
                            <th style={{ padding: '12px', fontWeight: 600 }}>Producto</th>
                            <th style={{ padding: '12px', fontWeight: 600, width: '140px', textAlign: 'right' }}>PVP (Venta)</th>
                            <th style={{ padding: '12px', fontWeight: 600, width: '100px', textAlign: 'center' }}>Stock</th>
                            <th style={{ padding: '12px', fontWeight: 600, width: '130px', textAlign: 'right' }}>Costo Compra</th>
                            <th style={{ padding: '12px', fontWeight: 600, width: '130px', textAlign: 'right' }}>Costo Envío</th>
                            <th style={{ padding: '12px', fontWeight: 600, width: '130px', textAlign: 'right' }}>Comisión Pasarela</th>
                            <th style={{ padding: '12px', fontWeight: 600, width: '140px', textAlign: 'center' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {configuracionFiltrada.map((p) => {
                            const estaEditando = editandoId === p.id
                            
                            return (
                              <tr 
                                key={p.id} 
                                style={{ 
                                  borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                                  background: estaEditando ? 'rgba(255, 122, 69, 0.02)' : 'transparent',
                                  transition: 'background 0.2s'
                                }}
                              >
                                <td style={{ padding: '14px 12px', fontWeight: 600 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {p.imagenUrl && (
                                      <img 
                                        src={p.imagenUrl} 
                                        alt={p.nombre} 
                                        style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.05)' }} 
                                      />
                                    )}
                                    <div>
                                      <span style={{ display: 'block' }}>{p.nombre}</span>
                                      <span style={{ fontSize: '0.72rem', color: '#686970', fontWeight: 500 }}>{p.categoriaNombre}</span>
                                    </div>
                                  </div>
                                </td>
                                
                                {/* Campo PVP */}
                                <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                                  {estaEditando ? (
                                    <input 
                                      type="number"
                                      value={valoresEdit.precio}
                                      onChange={(e) => setValoresEdit({ ...valoresEdit, precio: parseFloat(e.target.value) || 0 })}
                                      style={{
                                        width: '100px',
                                        padding: '0.4rem',
                                        background: '#0d0d0f',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        textAlign: 'right',
                                        fontWeight: 700
                                      }}
                                    />
                                  ) : (
                                    <span style={{ fontWeight: 700, color: '#fff' }}>{formatCOP(p.precio)}</span>
                                  )}
                                </td>

                                {/* Campo Stock */}
                                <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                                  {estaEditando ? (
                                    <input 
                                      type="number"
                                      value={valoresEdit.stock}
                                      onChange={(e) => setValoresEdit({ ...valoresEdit, stock: parseInt(e.target.value) || 0 })}
                                      style={{
                                        width: '70px',
                                        padding: '0.4rem',
                                        background: '#0d0d0f',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        textAlign: 'center',
                                        fontWeight: 700
                                      }}
                                    />
                                  ) : (
                                    <span style={{ fontWeight: 700, color: p.stock === 0 ? '#ef4444' : '#fff' }}>{p.stock}</span>
                                  )}
                                </td>

                                {/* Campo Costo Proveedor */}
                                <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                                  {estaEditando ? (
                                    <input 
                                      type="number"
                                      value={valoresEdit.costoProveedor}
                                      onChange={(e) => setValoresEdit({ ...valoresEdit, costoProveedor: parseFloat(e.target.value) || 0 })}
                                      style={{
                                        width: '100px',
                                        padding: '0.4rem',
                                        background: '#0d0d0f',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        textAlign: 'right'
                                      }}
                                    />
                                  ) : (
                                    <span style={{ color: '#c8c9d0' }}>{formatCOP(p.costoProveedor)}</span>
                                  )}
                                </td>

                                {/* Campo Costo Envío */}
                                <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                                  {estaEditando ? (
                                    <input 
                                      type="number"
                                      value={valoresEdit.costoEmpaqueEnvio}
                                      onChange={(e) => setValoresEdit({ ...valoresEdit, costoEmpaqueEnvio: parseFloat(e.target.value) || 0 })}
                                      style={{
                                        width: '100px',
                                        padding: '0.4rem',
                                        background: '#0d0d0f',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        textAlign: 'right'
                                      }}
                                    />
                                  ) : (
                                    <span style={{ color: '#c8c9d0' }}>{formatCOP(p.costoEmpaqueEnvio)}</span>
                                  )}
                                </td>

                                {/* Campo Comisión Pasarela */}
                                <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                                  {estaEditando ? (
                                    <input 
                                      type="number"
                                      value={valoresEdit.comisionPasarelaFija}
                                      onChange={(e) => setValoresEdit({ ...valoresEdit, comisionPasarelaFija: parseFloat(e.target.value) || 0 })}
                                      style={{
                                        width: '100px',
                                        padding: '0.4rem',
                                        background: '#0d0d0f',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        textAlign: 'right'
                                      }}
                                    />
                                  ) : (
                                    <span style={{ color: '#c8c9d0' }}>{formatCOP(p.comisionPasarelaFija)}</span>
                                  )}
                                </td>

                                {/* Acciones */}
                                <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                                  {estaEditando ? (
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                      <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => guardarConfiguracionManual(p)}
                                        style={{
                                          padding: '0.4rem 0.8rem',
                                          background: '#22c55e',
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '8px',
                                          cursor: 'pointer',
                                          fontWeight: 700,
                                          fontSize: '0.78rem',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <Save size={13} />
                                        Guardar
                                      </motion.button>
                                      
                                      <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setEditandoId(null)}
                                        style={{
                                          padding: '0.4rem 0.8rem',
                                          background: '#ef4444',
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '8px',
                                          cursor: 'pointer',
                                          fontWeight: 700,
                                          fontSize: '0.78rem',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <X size={13} />
                                        Cancelar
                                      </motion.button>
                                    </div>
                                  ) : (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => iniciarEdicion(p)}
                                      style={{
                                        padding: '0.4rem 0.8rem',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        color: '#ff7a45',
                                        border: '1px solid rgba(255, 122, 69, 0.2)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        fontSize: '0.78rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        margin: '0 auto'
                                      }}
                                    >
                                      <Edit2 size={13} />
                                      Modificar Costos
                                    </motion.button>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
