import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

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

// ——— Productos ———
export const getProductos = () => api.get('/productos')
export const getVirales = () => api.get('/productos/virales')
export const getProductoById = (id) => api.get(`/productos/${id}`)
export const buscarProductos = (nombre) => api.get(`/productos/buscar?nombre=${nombre}`)
export const getStockBajo = (umbral = 5) => api.get(`/productos/stock-bajo?umbral=${umbral}`)
export const crearProducto = (data) => api.post('/productos', data)
export const actualizarProducto = (id, data) => api.put(`/productos/${id}`, data)
export const eliminarProducto = (id) => api.delete(`/productos/${id}`)

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

// ——— Gamificación ———
export const girarRuleta = () => api.post('/usuarios/ruleta/girar')

export default api
