import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

// Adjunta el token JWT automáticamente en cada request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('tribu_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Si el servidor responde 401 o 403, limpiar sesión y redirigir
// EXCEPTO si es el propio endpoint de login (ahí queremos mostrar el error)
api.interceptors.response.use(
    res => res,
    err => {
        const isLoginEndpoint = err.config?.url?.includes('/auth/login')
        const isRegisterEndpoint = err.config?.url?.includes('/auth/register')
        if ((err.response?.status === 401 || err.response?.status === 403) && !isLoginEndpoint && !isRegisterEndpoint) {
            localStorage.removeItem('tribu_token')
            localStorage.removeItem('tribu_user')
            window.location.href = '/login'
        }
        return Promise.reject(err)
    }
)

// ——— Auth ———
export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)

// ——— Tiers ———
export const getTiers = () => api.get('/tiers')

// ——— Productos ———
export const getProductos = () => api.get('/productos')
export const getVirales = () => api.get('/productos/virales')
export const getProductoById = (id) => api.get(`/productos/${id}`)
export const buscarProductos = (nombre) => api.get(`/productos/buscar?nombre=${nombre}`)
export const getStockBajo = (umbral = 5) => api.get(`/productos/stock-bajo?umbral=${umbral}`)
export const crearProducto = (data) => api.post('/productos', data)
export const actualizarProducto = (id, data) => api.put(`/productos/${id}`, data)
export const eliminarProducto = (id) => api.delete(`/productos/${id}`)
export const getProductosFinancieros = () => api.get('/admin/productos/financiero')
export const getDashboardKpis = () => api.get('/admin/dashboard/kpis')
export const getResumenCaja = () => api.get('/admin/finanzas/resumen-caja')
export const getRegistroVentas = () => api.get('/admin/finanzas/registro-ventas')
export const getProductosRentabilidad = () => api.get('/admin/finanzas/productos-rentabilidad')

// ——— Categorías ———
export const getCategorias = () => api.get('/categorias')
export const crearCategoria = (data) => api.post('/categorias', data)
export const actualizarCategoria = (id, data) => api.put(`/categorias/${id}`, data)
export const eliminarCategoria = (id) => api.delete(`/categorias/${id}`)

// ——— Pedidos (cliente) ———
export const getMisPedidos = () => api.get('/pedidos')
export const crearPedido = (data) => api.post('/pedidos', data)

// ——— Admin: Pedidos ———
export const getAllPedidos = () => api.get('/admin/pedidos')
export const getPedidosByEstado = (estado) => api.get(`/admin/pedidos/estado/${estado}`)
export const actualizarEstadoPedido = (id, data) => api.patch(`/admin/pedidos/${id}/estado`, data)

// ——— Admin: Usuarios ———
export const getUsuarios = () => api.get('/admin/usuarios')
export const promoverAdmin = (id) => api.patch(`/admin/usuarios/${id}/promover-admin`)
export const asignarCliente = (id) => api.patch(`/admin/usuarios/${id}/asignar-cliente`)

// ——— Devoluciones ———
export const crearDevolucion = (formData) => api.post('/devoluciones', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
})
export const getTodasLasDevoluciones = () => api.get('/admin/devoluciones')
export const actualizarEstadoDevolucion = (id, data) => api.patch(`/admin/devoluciones/${id}/estado`, data)
export const reembolsarSaldoDevolucion = (id, monto) => api.post(`/admin/devoluciones/${id}/reembolsar-saldo`, { monto })
export const getEstadisticasDevolucion = () => api.get('/admin/devoluciones/estadisticas')

// ——— Admin: CRM ———
export const getTodasLasNotas = () => api.get('/admin/crm/notas')
export const getNotasPorCliente = (clienteId) => api.get(`/admin/crm/notas/cliente/${clienteId}`)
export const crearNota = (data) => api.post('/admin/crm/notas', data)

// ——— Perfil de Usuario ———
export const getMiPerfil = () => api.get('/usuarios/perfil')
export const updateMiPerfil = (data) => api.put('/usuarios/perfil', data)
export const getMisMovimientos = () => api.get('/usuarios/perfil/movimientos')

// ——— Tribu Pass ———
export const getTribuPassEstado = () => api.get('/tribu-pass/mi-estado')
export const activarTribuPass = (metodoPago) => api.post('/tribu-pass/activar', { metodoPago })
export const cancelarTribuPass = () => api.post('/tribu-pass/cancelar')
export const getTribuPassBeneficios = () => api.get('/tribu-pass/beneficios')
export const getTribuPassHistorial = () => api.get('/tribu-pass/historial')
export const actualizarRenovacionAutomatica = (enabled) => api.put('/tribu-pass/renovacion-automatica', { enabled })

// ——— Cupones ———
export const validarCupon = (codigo, totalCarrito) => api.post('/cupones/validar', { codigo, totalCarrito })
export const getMisCupones = () => api.get('/cupones/mis-cupones')

// ——— Facturas ———
export const solicitarFactura = (data) => api.post('/facturas/solicitar', data)
export const getMisFacturas = () => api.get('/facturas/mis-facturas')
export const getFacturaPorPedido = (pedidoId) => api.get(`/facturas/pedido/${pedidoId}`)
export const descargarFacturaPdf = (id) => api.get(`/facturas/${id}/pdf`, { responseType: 'blob' })
export const adminCompletarDatosFactura = (pedidoId, data) => api.post(`/facturas/pedido/${pedidoId}/datos`, data)
export const adminActualizarDatosFactura = (id, data) => api.patch(`/facturas/admin/${id}`, data)

// ——— Admin: Marketing Expansion ———
export const getAdminCupones = () => api.get('/admin/cupones')
export const crearAdminCupon = (data) => api.post('/admin/cupones', data)
export const actualizarAdminCupon = (id, data) => api.put(`/admin/cupones/${id}`, data)
export const eliminarAdminCupon = (id) => api.delete(`/admin/cupones/${id}`)
export const getAdminCuponStats = (id) => api.get(`/admin/cupones/${id}/stats`)
export const getAdminFacturas = () => api.get('/facturas/admin/todas')

// ——— Admin: Seguridad ———
export const getSeguridadAccesos = () => api.get('/admin/seguridad/accesos')
export const adminGetSecuritySessions = () => api.get('/admin/seguridad/sessions')
export const adminGetSecurityThreats = () => api.get('/admin/seguridad/threats')
export const adminGetSecurityAudit = () => api.get('/admin/seguridad/audit')
export const adminExecuteSecurityAction = (type, payload) => api.post(`/admin/seguridad/action/${type}`, payload)

// ——— Admin: Tribu Card (Ledger) ———
export const adminGetMovimientosTribuCard = ({ q = '', estado = '', tipo = '', page = 0, size = 25 } = {}) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (estado) params.set('estado', estado)
    if (tipo) params.set('tipo', tipo)
    params.set('page', String(page))
    params.set('size', String(size))
    return api.get(`/admin/tribu-card/movimientos?${params.toString()}`)
}

export const adminGetTribuCardResumen = () => api.get('/admin/tribu-card/resumen')

// ——— Admin: Transferencias P2P ———
export const adminGetTransferencias = ({ q = '', estado = '', page = 0, size = 25 } = {}) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (estado) params.set('estado', estado)
    params.set('page', String(page))
    params.set('size', String(size))
    return api.get(`/admin/transferencias?${params.toString()}`)
}

// ——— Gamificación ———
export const girarRuleta = () => api.post('/usuarios/ruleta/girar')
export const getLogros = () => api.get('/usuarios/logros')
export const getMiRacha = () => api.get('/usuarios/mi-racha')

// ——— Recompensas ———
export const getRecompensas = () => api.get('/recompensas')
export const canjearRecompensa = (recompensaId) => api.post('/recompensas/canjear', { recompensaId })
export const getMisCanjes = () => api.get('/recompensas/mis-canjes')

// ——— Soporte (Atención al Cliente) ———
export const iniciarConversacionSoporte = (pedidoId = null) => api.post('/soporte/conversaciones', { pedidoId })
export const getMisConversacionesSoporte = () => api.get('/soporte/conversaciones')
export const getMensajesConversacionSoporte = (id) => api.get(`/soporte/conversaciones/${id}/mensajes`)
export const enviarMensajeSoporte = (id, contenido) => api.post(`/soporte/conversaciones/${id}/mensajes`, { contenido })

// ——— Admin: Soporte ———
export const adminGetConversacionesSoporte = (estado = '') => api.get(`/admin/soporte/conversaciones${estado ? '?estado=' + estado : ''}`)
export const adminGetMensajesSoporte = (id) => api.get(`/admin/soporte/conversaciones/${id}/mensajes`)
export const adminEnviarMensajeSoporte = (id, contenido) => api.post(`/admin/soporte/conversaciones/${id}/mensajes`, { contenido })
export const adminResolverConversacionSoporte = (id) => api.post(`/admin/soporte/conversaciones/${id}/resolver`)

export default api
