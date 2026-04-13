import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, LogIn, ArrowLeft, Search, Gift, ShoppingCart, CreditCard } from 'lucide-react'
import { grupoService } from '../services/services'
import GrupoCard from '../components/GrupoCard'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { getTierColor, getTierFromOrden } from '../utils/tierColors'

export default function GruposPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('mis-grupos')
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [codigoUnirse, setCodigoUnirse] = useState('')
  const [uniendo, setUniendo] = useState(false)
  const [crearStep, setCrearStep] = useState(0)
  const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: '', emoji: '🍕', productos: [] })

  const tierColor = getTierColor(getTierFromOrden(user?.nivelVip || 1))

  useEffect(() => {
    if (tab === 'mis-grupos') {
      setLoading(true)
      grupoService.misGrupos()
        .then(res => setGrupos(res.data || []))
        .catch(() => setGrupos([]))
        .finally(() => setLoading(false))
    }
  }, [tab])

  const handleUnirse = async () => {
    if (!codigoUnirse.trim()) return
    setUniendo(true)
    try {
      await grupoService.unirse(codigoUnirse.trim())
      setCodigoUnirse('')
      setTab('mis-grupos')
    } catch (err) {
      alert(err.response?.data?.message || 'Error al unirse al grupo')
    } finally {
      setUniendo(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background, #0a0a0a)',
      paddingTop: '5rem',
      paddingBottom: '2rem'
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 1rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Users size={28} color={tierColor.primary} />
            Grupos de Compra
          </h1>
          <p style={{ color: '#888', fontSize: '0.9rem', marginTop: 4 }}>
            Compra en grupo y ahorra más
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: '1.5rem',
          background: 'var(--color-background-primary, #1a1a1a)',
          padding: 4,
          borderRadius: 12
        }}>
          {[
            { id: 'mis-grupos', label: 'Mis Grupos', icon: Users },
            { id: 'crear', label: 'Crear', icon: Plus },
            { id: 'unirse', label: 'Unirse', icon: LogIn }
          ].map(t => (
            <motion.button
              key={t.id}
              onClick={() => setTab(t.id)}
              whileTap={{ scale: 0.98 }}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: tab === t.id ? tierColor.primary : 'transparent',
                color: tab === t.id ? '#000' : '#888',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <t.icon size={16} />
              {t.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'mis-grupos' && (
            <motion.div
              key="mis-grupos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {loading ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                  Cargando...
                </div>
              ) : grupos.length === 0 ? (
                <EmptyState
                  icon={Users}
                  titulo="Sin grupos activos"
                  descripcion="No参与as ningún grupo de compra actualmente"
                  actionLabel="Crear un grupo"
                  onAction={() => setTab('crear')}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {grupos.map((grupo, idx) => (
                    <GrupoCard key={grupo.id} grupo={grupo} index={idx} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'crear' && (
            <motion.div
              key="crear"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div style={{
                background: 'var(--color-background-primary, #1a1a1a)',
                borderRadius: 16,
                padding: '1.5rem'
              }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                  Nuevo Grupo
                </h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: 8 }}>
                    Nombre del grupo
                  </label>
                  <input
                    type="text"
                    value={nuevoGrupo.nombre}
                    onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, nombre: e.target.value })}
                    placeholder="Ej. Almuerzo del viernes"
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      background: 'var(--color-background-secondary, #2a2a2a)',
                      border: '1px solid var(--color-border-tertiary, #333)',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: 8 }}>
                    Emoji
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['🍕', '🎉', '👕', '🎁', '🛒', '🎂'].map(emoji => (
                      <motion.button
                        key={emoji}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setNuevoGrupo({ ...nuevoGrupo, emoji })}
                        style={{
                          width: 48,
                          height: 48,
                          fontSize: 24,
                          background: nuevoGrupo.emoji === emoji ? tierColor.primary : 'var(--color-background-secondary, #2a2a2a)',
                          border: 'none',
                          borderRadius: 10,
                          cursor: 'pointer'
                        }}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: nuevoGrupo.nombre ? 1.02 : 1 }}
                  whileTap={{ scale: nuevoGrupo.nombre ? 0.98 : 1 }}
                  disabled={!nuevoGrupo.nombre}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: nuevoGrupo.nombre ? tierColor.primary : '#333',
                    color: nuevoGrupo.nombre ? '#000' : '#666',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: nuevoGrupo.nombre ? 'pointer' : 'not-allowed'
                  }}
                >
                  Continuar
                </motion.button>
              </div>
            </motion.div>
          )}

          {tab === 'unirse' && (
            <motion.div
              key="unirse"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div style={{
                background: 'var(--color-background-primary, #1a1a1a)',
                borderRadius: 16,
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <LogIn size={48} color={tierColor.primary} style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  Unirse a un grupo
                </h3>
                <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Ingresa el código que te compartió el organizador
                </p>
                
                <input
                  type="text"
                  value={codigoUnirse}
                  onChange={(e) => setCodigoUnirse(e.target.value.toUpperCase())}
                  placeholder="TRB-XXXX"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'var(--color-background-secondary, #2a2a2a)',
                    border: '1px solid var(--color-border-tertiary, #333)',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: '1.5rem',
                    textAlign: 'center',
                    letterSpacing: 4,
                    marginBottom: '1.5rem',
                    outline: 'none'
                  }}
                />

                <motion.button
                  whileHover={{ scale: codigoUnirse ? 1.02 : 1 }}
                  whileTap={{ scale: codigoUnirse ? 0.98 : 1 }}
                  disabled={!codigoUnirse || uniendo}
                  onClick={handleUnirse}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: codigoUnirse ? tierColor.primary : '#333',
                    color: codigoUnirse ? '#000' : '#666',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: codigoUnirse ? 'pointer' : 'not-allowed'
                  }}
                >
                  {uniendo ? 'Uniéndote...' : 'Unirme al grupo'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
