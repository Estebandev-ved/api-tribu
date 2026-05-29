import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Bell, Mail, Smartphone, BellOff } from 'lucide-react'
import profileService from '../../services/profileService'
import toast from 'react-hot-toast'
import { playExoticClick, playExoticChime } from '../../utils/soundEffects'

const GRUPOS_NOTIFICACIONES = {
  preferencias: {
    label: 'Configuración general de avisos',
    items: [
      { key: 'transacciones', label: 'Pedidos y Finanzas (Estados, cashback, transferencias y Tribu Card)', canales: ['email', 'push', 'app'] },
      { key: 'comunidad', label: 'Grupos y Comunidad (Compras grupales, invitaciones y referidos)', canales: ['push', 'app'] },
      { key: 'marketing', label: 'Promociones y Novedades (Ofertas exclusivas, noticias y dinámicas)', canales: ['email', 'push'] }
    ]
  }
}

function MiniToggle({ checked, onChange }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(!checked) }}
      style={{
        width: 32,
        height: 18,
        borderRadius: 9,
        background: checked ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s'
      }}
    >
      <motion.div
        animate={{ x: checked ? 14 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2
        }}
      />
    </button>
  )
}

export default function ProfileNotificacionesSection() {
  const [preferencias, setPreferencias] = useState({})
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    profileService.getPreferenciasNotificaciones()
      .then(res => {
        setPreferencias(res.data || {})
      })
      .catch(() => {
        const defaults = {}
        Object.values(GRUPOS_NOTIFICACIONES).forEach(grupo => {
          grupo.items.forEach(item => {
            defaults[item.key] = {
              email: item.canales.includes('email'),
              push: item.canales.includes('push'),
              app: item.canales.includes('app')
            }
          })
        })
        setPreferencias(defaults)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = useCallback((clave, canal) => {
    playExoticClick()
    setPreferencias(prev => ({
      ...prev,
      [clave]: {
        ...prev[clave],
        [canal]: !prev[clave]?.[canal]
      }
    }))
    setSaved(false)
  }, [])

  const handleGuardar = useCallback(async () => {
    playExoticClick()
    setGuardando(true)
    try {
      await profileService.updatePreferenciasNotificaciones(preferencias)
      setSaved(true)
      playExoticChime()
      toast.success('Preferencias guardadas')
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      toast.error('Error al guardar preferencias')
    } finally {
      setGuardando(false)
    }
  }, [preferencias])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(20,20,20,0.6)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1rem',
        padding: '2rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🔔 Notificaciones
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <Mail size={14} />
          <Smartphone size={14} />
          <Bell size={14} />
        </div>
      </div>

      {Object.entries(GRUPOS_NOTIFICACIONES).map(([grupoKey, grupo]) => (
        <div key={grupoKey} style={{ marginBottom: '2rem' }}>
          <h4 style={{ 
            fontSize: '0.85rem', 
            fontWeight: 600, 
            color: 'var(--color-text-muted)', 
            marginBottom: '1rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            paddingBottom: '0.5rem'
          }}>
            {grupo.label}
          </h4>
          
          {grupo.items.map(item => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)'
              }}
            >
              <span style={{ color: 'var(--color-text)', fontSize: '0.9rem' }}>
                {item.label}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {item.canales.includes('email') && (
                  <MiniToggle
                    checked={preferencias[item.key]?.email}
                    onChange={() => handleToggle(item.key, 'email')}
                  />
                )}
                {item.canales.includes('push') && (
                  <MiniToggle
                    checked={preferencias[item.key]?.push}
                    onChange={() => handleToggle(item.key, 'push')}
                  />
                )}
                {item.canales.includes('app') && (
                  <MiniToggle
                    checked={preferencias[item.key]?.app}
                    onChange={() => handleToggle(item.key, 'app')}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.08)' 
      }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGuardar}
          disabled={guardando}
          style={{
            background: saved ? '#00C896' : 'var(--color-primary)',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 2rem',
            cursor: guardando ? 'not-allowed' : 'pointer',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {guardando ? (
            <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          ) : saved ? (
            <>✓ Guardado</>
          ) : (
            'Guardar preferencias'
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}