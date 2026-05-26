import api from '../api'

export const transferenciaService = {
  validarDestinatario: (destinatario) =>
    api.post('/transferencias/validar-destinatario', { destinatario }),
  enviar: (destinatario, monto, mensaje, pin) =>
    api.post('/transferencias/enviar', { destinatario, monto, mensaje, pin }),
  historial: () => api.get('/transferencias/historial'),
  limiteDisponible: () => api.get('/transferencias/limite-disponible')
}

export const pinService = {
  setPin: (pinNuevo, pinActual) =>
    api.post('/usuarios/perfil/pin', { pinNuevo, pinActual }),
  verificarPin: (pin) =>
    api.post('/usuarios/perfil/verificar-pin', { pin })
}

export const grupoService = {
  crear: (data) => api.post('/grupos/crear', data),
  unirse: (codigo) => api.post(`/grupos/unirse/${codigo}`),
  detalle: (id) => api.get(`/grupos/${id}`),
  pagar: (id) => api.post(`/grupos/${id}/pagar`),
  splitEquitativo: (id) => api.post(`/grupos/${id}/split/equitativo`),
  splitPersonalizado: (id, splits) =>
    api.post(`/grupos/${id}/split/personalizado`, splits),
  misGrupos: () => api.get('/grupos/mis-grupos')
}

export const leaderboardService = {
  topMes: (limite = 10) => api.get(`/leaderboard/mes-actual?limite=${limite}`),
  miPosicion: () => api.get('/leaderboard/mi-posicion'),
  historico: (mes) => api.get(`/leaderboard/historico?mes=${mes}`)
}

export const rachaService = {
  miRacha: () => api.get('/usuarios/mi-racha'),
  historialBonificaciones: () => api.get('/usuarios/racha/historial')
}

export const referidosService = {
  miArbol: () => api.get('/referidos/mi-arbol'),
  stats: () => api.get('/referidos/stats')
}

export const campanasService = {
  activa: () => api.get('/campanas/activa'),
  todas: () => api.get('/admin/campanas'),
  crear: (data) => api.post('/admin/campanas', data),
  activar: (id) => api.put(`/admin/campanas/${id}/activar`),
  segmentosConteo: () => api.get('/admin/campanas-marketing/segmentos/conteo'),
  campanasMarketing: () => api.get('/admin/campanas-marketing'),
  crearCampanaMarketing: (data) => api.post('/admin/campanas-marketing', data),
  ejecutar: (id) => api.post(`/admin/campanas-marketing/${id}/ejecutar`)
}

export const adminService = {
  inventarioStats: () => api.get('/admin/inventario/stats'),
  actualizarStock: (id, stock) => api.put(`/admin/inventario/${id}/stock`, { stock }),
  actualizarUmbrales: (id, data) => api.put(`/admin/inventario/${id}/umbrales`, data),
  telegramConfig: () => api.get('/admin/telegram/config'),
  guardarTelegramConfig: (data) => api.post('/admin/telegram/config', data),
  activarTelegram: () => api.post('/admin/telegram/activar'),
  desactivarTelegram: () => api.post('/admin/telegram/desactivar'),
  testTelegram: () => api.post('/admin/telegram/test'),
  telegramHistorial: (limite = 20) => api.get(`/admin/telegram/historial?limite=${limite}`),
  telegramPreferencias: () => api.get('/admin/telegram/preferencias'),
  guardarTelegramPreferencias: (data) => api.put('/admin/telegram/preferencias', data)
}

export const recomendacionesService = {
  paraTi: (limite = 6) => api.get(`/recomendaciones?limite=${limite}`)
}

export const movimientosService = {
  listar: (estado) => api.get(`/movimientos?estado=${estado || ''}`)
}
