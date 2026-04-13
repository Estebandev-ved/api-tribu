import api from '../api'

export const profileService = {
  getPerfil: () => api.get('/usuarios/perfil'),
  updatePerfil: (data) => api.put('/usuarios/perfil', data),
  uploadFotoPerfil: (file) => {
    const formData = new FormData()
    formData.append('foto', file)
    return api.post('/usuarios/foto-perfil', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  verificarEmail: (email) => api.get(`/auth/verificar-email?email=${encodeURIComponent(email)}`),
  reenviarVerificacion: () => api.post('/auth/reenviar-verificacion'),
  cambiarContrasena: (data) => api.put('/auth/cambiar-contrasena', data),
  configurarPin: (pin) => api.post('/auth/configurar-pin', { pin }),
  desactivarPin: () => api.delete('/auth/configurar-pin'),
  getSesiones: () => api.get('/auth/sesiones'),
  cerrarSesion: (id) => api.delete(`/auth/sesiones/${id}`),
  cerrarOtrasSesiones: () => api.delete('/auth/sesiones/otras'),
  getPreferenciasNotificaciones: () => api.get('/usuarios/preferencias-notificaciones'),
  updatePreferenciasNotificaciones: (data) => api.put('/usuarios/preferencias-notificaciones', data),
  getMiTribuCardInfo: () => api.get('/usuarios/mi-tribu-card-info'),
  getMisDevoluciones: () => api.get('/devoluciones/mis-devoluciones'),
  getDevolucion: (id) => api.get(`/devoluciones/${id}`),
  solicitarDevolucion: (formData) => api.post('/devoluciones/solicitar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getReferidos: () => api.get('/referidos/mis-referidos'),
  getEstadisticasReferidos: () => api.get('/referidos/stats'),
  getLogros: () => api.get('/usuarios/logros'),
  getRacha: () => api.get('/usuarios/mi-racha'),
  getAyudaFAQs: () => api.get('/ayuda/faqs'),
  reportarProblema: (formData) => api.post('/soporte/reportar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  eliminarCuenta: (data) => api.delete('/usuarios/mi-cuenta', { data }),
  getPedidos: () => api.get('/pedidos'),
  getPedido: (id) => api.get(`/pedidos/${id}`),
  getCiudades: () => api.get('/utils/ciudades'),
}

export default profileService