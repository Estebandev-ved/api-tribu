import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Key, User, Bell, MessageSquare, History, HelpCircle, ChevronDown, ChevronUp, Send, Loader2, X, Plus, Eye, EyeOff } from 'lucide-react'
import { adminService } from '../../services/services'
import { formatFechaHora } from '../../utils/formatters'
import Skeleton from '../../components/Skeleton'

const PASOS_SETUP = [
  {
    titulo: '¿Cómo crear el bot en Telegram?',
    contenido: '1. Abre Telegram y busca @BotFather\n2. Escribe /newbot\n3. Dale un nombre: "Tribu Card Admin"\n4. Dale un username: "TribuCardAdminBot"\n5. BotFather te da el token — cópialo arriba'
  },
  {
    titulo: '¿Cómo obtener tu Chat ID?',
    contenido: '1. Busca @userinfobot en Telegram\n2. Escribe cualquier mensaje\n3. Te responde con tu ID — cópialo en "IDs de admins"'
  },
  {
    titulo: '¿Qué pasa si desactivo el bot?',
    contenido: 'Solo deja de recibir notificaciones. Los datos y la configuración se conservan.'
  }
]

export default function TelegramConfigPage() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [testEnviando, setTestEnviando] = useState(false)
  const [historial, setHistorial] = useState([])
  const [preferencias, setPreferencias] = useState({})
  const [mostrarToken, setMostrarToken] = useState(false)
  const [adminIds, setAdminIds] = useState([])
  const [nuevoId, setNuevoId] = useState('')
  const [expanded, setExpanded] = useState(null)

  const [formData, setFormData] = useState({
    token: '',
    username: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [configRes, histRes, prefRes] = await Promise.all([
        adminService.telegramConfig().catch(() => ({ data: null })),
        adminService.telegramHistorial(20).catch(() => ({ data: [] })),
        adminService.telegramPreferencias().catch(() => ({}))
      ])
      setConfig(configRes.data)
      setHistorial(histRes.data || [])
      setPreferencias(prefRes.data || {})
      
      if (configRes.data) {
        setAdminIds(configRes.data.adminIds || [])
        setFormData({
          token: configRes.data.tokenEnmascarado || '',
          username: configRes.data.username || ''
        })
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      await adminService.guardarTelegramConfig({
        token: formData.token,
        username: formData.username,
        adminIds
      })
      alert('Configuración guardada')
      fetchData()
    } catch (err) {
      alert('Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const handleToggleBot = async () => {
    try {
      if (config?.activo) {
        await adminService.desactivarTelegram()
      } else {
        await adminService.activarTelegram()
      }
      fetchData()
    } catch (err) {
      alert('Error al togglear bot')
    }
  }

  const handleTest = async () => {
    setTestEnviando(true)
    try {
      await adminService.testTelegram()
      alert('Mensaje enviado a los admins')
      fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Error al enviar')
    } finally {
      setTestEnviando(false)
    }
  }

  const handlePrefChange = async (key, value) => {
    const newPrefs = { ...preferencias, [key]: value }
    setPreferencias(newPrefs)
    try {
      await adminService.guardarTelegramPreferencias(newPrefs)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const agregarAdminId = () => {
    if (nuevoId.trim() && !adminIds.includes(nuevoId.trim())) {
      setAdminIds([...adminIds, nuevoId.trim()])
      setNuevoId('')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '5rem 1rem 2rem' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Skeleton h={100} r={16} />
          <Skeleton h={200} r={16} style={{ marginTop: 16 }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background, #0a0a0a)',
      paddingTop: '5rem',
      paddingBottom: '2rem'
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 1rem' }}>
        
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot size={28} color="#ff5722" />
          Bot de Telegram
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--color-background-primary, #1a1a1a)',
            borderRadius: 16,
            padding: '1.25rem',
            marginBottom: '1.5rem',
            borderLeft: `4px solid ${config?.activo ? '#1D9E75' : '#E24B4A'}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <motion.div
              style={{
                width: 14, height: 14, borderRadius: '50%',
                background: config?.activo ? '#1D9E75' : '#E24B4A'
              }}
              animate={config?.activo ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, color: '#fff', fontWeight: 600 }}>
                {config?.activo ? '🟢 Bot activo y escuchando' : '🔴 Bot desconectado'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#666' }}>
                {config?.activo
                  ? `@${config.username || 'tribu_admin_bot'} · Conectado`
                  : 'Configura el token para activar'}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleToggleBot}
              disabled={!config?.token}
              style={{
                padding: '0.5rem 1rem',
                background: config?.activo ? '#E24B4A' : '#1D9E75',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: config?.token ? 'pointer' : 'not-allowed',
                opacity: config?.token ? 1 : 0.5
              }}
            >
              {config?.activo ? 'Desactivar' : 'Activar'}
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'var(--color-background-primary, #1a1a1a)',
            borderRadius: 16,
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}
        >
          <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={18} color="#ff5722" />
            Credenciales del bot
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Bot Token</label>
            <div style={{ position: 'relative' }}>
              <input
                type={mostrarToken ? 'text' : 'password'}
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                placeholder={config?.tokenEnmascarado ? `${config.tokenEnmascarado} (guardado)` : 'Ingresa el token'}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem 0.75rem 1rem',
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: 8,
                  color: '#fff',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => setMostrarToken(!mostrarToken)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer'
                }}
              >
                {mostrarToken ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p style={{ color: '#666', fontSize: '0.75rem', marginTop: 4 }}>
              Obtén el token en @BotFather de Telegram
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Username del bot</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="@TribuCardAdminBot"
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
            <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>IDs de admins autorizados</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {adminIds.map(id => (
                <motion.span
                  key={id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: '0.85rem',
                    color: '#fff'
                  }}
                >
                  {id}
                  <X
                    size={14}
                    style={{ cursor: 'pointer', opacity: 0.5 }}
                    onClick={() => setAdminIds(adminIds.filter(i => i !== id))}
                  />
                </motion.span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={nuevoId}
                onChange={(e) => setNuevoId(e.target.value)}
                placeholder="Agregar ID"
                onKeyDown={(e) => e.key === 'Enter' && agregarAdminId()}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button
                onClick={agregarAdminId}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGuardar}
            disabled={guardando}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: '#ff5722',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {guardando ? <Loader2 size={18} className="animate-spin" /> : null}
            Guardar configuración
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--color-background-primary, #1a1a1a)',
            borderRadius: 16,
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}
        >
          <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} color="#ff5722" />
            Configuración de alertas
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'stockCritico', label: 'Stock crítico (≤ umbral crítico)' },
              { key: 'stockBajo', label: 'Stock bajo (≤ umbral mínimo)' },
              { key: 'reporteDiario', label: 'Reporte diario 7:00 AM' },
              { key: 'pedidoGrande', label: 'Pedidos grandes (≥ $500.000)' },
              { key: 'nuevoUsuario', label: 'Nuevo usuario registrado' },
              { key: 'errorSistema', label: 'Error del sistema' },
              { key: 'grupoConfirmado', label: 'Grupo de compra confirmado' }
            ].map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span style={{ color: '#ccc', fontSize: '0.9rem' }}>{item.label}</span>
                <div
                  onClick={() => handlePrefChange(item.key, !preferencias[item.key])}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    background: preferencias[item.key] ? '#ff5722' : '#333',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  <motion.div
                    animate={{ x: preferencias[item.key] ? 20 : 2 }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: 2
                    }}
                  />
                </div>
              </label>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'var(--color-background-primary, #1a1a1a)',
            borderRadius: 16,
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}
        >
          <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} color="#ff5722" />
            Historial de alertas
          </h3>

          {historial.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '1rem' }}>Sin alertas enviadas</p>
          ) : (
            <div style={{ fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.5fr', gap: 8, marginBottom: 8, color: '#666', fontWeight: 600 }}>
                <span>Fecha/hora</span>
                <span>Tipo</span>
                <span>Estado</span>
              </div>
              {historial.slice(0, 10).map((h, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.5fr', gap: 8, padding: '8px 0', borderTop: '0.5px solid #2a2a2a' }}>
                  <span style={{ color: '#888' }}>{formatFechaHora(h.fecha)}</span>
                  <span style={{ color: '#fff' }}>{h.tipo}</span>
                  <span style={{ color: h.estado === 'ENVIADO' ? '#1D9E75' : '#E24B4A' }}>{h.estado}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'var(--color-background-primary, #1a1a1a)',
            borderRadius: 16,
            overflow: 'hidden'
          }}
        >
          {PASOS_SETUP.map((paso, idx) => (
            <div key={idx} style={{ borderBottom: '0.5px solid #2a2a2a' }}>
              <button
                onClick={() => setExpanded(expanded === idx ? null : idx)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '1rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 500 }}>{paso.titulo}</span>
                <motion.span animate={{ rotate: expanded === idx ? 180 : 0 }} style={{ color: '#666' }}>
                  <ChevronDown size={18} />
                </motion.span>
              </button>
              <AnimatePresence>
                {expanded === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p style={{ fontSize: '0.85rem', color: '#888', padding: '0 1rem 1rem', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                      {paso.contenido}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
