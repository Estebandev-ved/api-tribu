import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Flame, Lock, Star, Gift, Target, Zap, Crown } from 'lucide-react'
import profileService from '../../services/profileService'
import toast from 'react-hot-toast'

const LOGROS_DATA = [
  { id: 'primera_compra', emoji: '🎯', titulo: 'Primera compra', descripcion: 'Realiza tu primera compra en Tribu Card', requerido: 1, actual: 0, recompensa: '$5.000' },
  { id: 'racha_7_dias', emoji: '🔥', titulo: 'Racha de 7 días', descripcion: 'Mantén una racha de 7 días consecutivos', requerido: 7, actual: 0, recompensa: '$10.000' },
  { id: 'saldo_10k', emoji: '💰', titulo: 'Ahorrador', descripcion: 'Alcanza $10.000 en saldo', requerido: 10000, actual: 0, recompensa: '$3.000' },
  { id: 'tier_plata', emoji: '👑', titulo: 'Tier Plata', descripcion: 'Alcanza el nivel Plata en Tribu Card', requerido: 1, actual: 0, recompensa: 'Acceso a beneficios' },
  { id: 'compra_100k', emoji: '💎', titulo: 'Comprador 100K', descripcion: 'Realiza compras por $100.000 en total', requerido: 100000, actual: 0, recompensa: '$15.000' },
  { id: 'racha_30_dias', emoji: '⚡', titulo: 'Racha Maestra', descripcion: 'Mantén una racha de 30 días consecutivos', requerido: 30, actual: 0, recompensa: '$25.000' },
  { id: 'tier_oro', emoji: '🏆', titulo: 'Tier Oro', descripcion: 'Alcanza el nivel Oro en Tribu Card', requerido: 1, actual: 0, recompensa: '5% cashback' },
  { id: 'referido_activo', emoji: '🤝', titulo: 'Embajador', descripcion: 'Consigue 3 referidos activos', requerido: 3, actual: 0, recompensa: '$30.000' }
]

function LogroBadge({ logro, desbloqueado, onClick }) {
  const opacity = desbloqueado ? 1 : 0.4
  const filter = desbloqueado ? 'none' : 'grayscale(100%)'

  return (
    <motion.button
      whileHover={desbloqueado ? { scale: 1.1, rotate: 5 } : { scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        background: desbloqueado ? 'rgba(255,87,34,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${desbloqueado ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '0.75rem',
        padding: '1rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        opacity,
        filter,
        position: 'relative'
      }}
    >
      {!desbloqueado && (
        <Lock size={16} style={{ position: 'absolute', top: 8, right: 8, color: 'var(--color-text-muted)' }} />
      )}
      <span style={{ fontSize: '2rem' }}>{logro.emoji}</span>
      <span style={{ color: 'var(--color-text)', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>
        {logro.titulo}
      </span>
      {desbloqueado && (
        <span style={{ color: '#00C896', fontSize: '0.65rem' }}>✓ Desbloqueado</span>
      )}
    </motion.button>
  )
}

function LogroModal({ logro, onClose }) {
  const progreso = logro.actual >= logro.requerido ? 100 : Math.round((logro.actual / logro.requerido) * 100)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a1a',
          borderRadius: '1rem',
          padding: '1.5rem',
          maxWidth: 350,
          width: '100%',
          textAlign: 'center'
        }}
      >
        <span style={{ fontSize: '4rem' }}>{logro.emoji}</span>
        <h3 style={{ color: 'var(--color-text)', margin: '1rem 0 0.5rem' }}>{logro.titulo}</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
          {logro.descripcion}
        </p>

        {logro.actual >= logro.requerido ? (
          <div style={{ 
            background: 'rgba(0,200,150,0.1)', 
            borderRadius: '0.5rem', 
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#00C896', fontWeight: 600, margin: 0 }}>
              ✓ Desbloqueado el {logro.fechaDesbloqueo || 'recientemente'}
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '0.5rem',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Progreso</span>
              <span style={{ color: 'var(--color-text)' }}>{logro.actual} / {logro.requerido}</span>
            </div>
            <div style={{ 
              height: 8, 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: 4, 
              overflow: 'hidden' 
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progreso}%` }}
                style={{ 
                  height: '100%', 
                  background: 'var(--color-primary)',
                  borderRadius: 4
                }}
              />
            </div>
          </div>
        )}

        <div style={{
          background: 'rgba(255,87,34,0.1)',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <Gift size={16} color="var(--color-primary)" />
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Recompensa: {logro.recompensa}
          </span>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'var(--color-primary)',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 2rem',
            color: '#fff',
            fontWeight: 600,
            marginTop: '1.5rem',
            cursor: 'pointer'
          }}
        >
          Cerrar
        </button>
      </motion.div>
    </motion.div>
  )
}

export default function ProfileLogrosSection() {
  const [logros, setLogros] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLogro, setSelectedLogro] = useState(null)
  const [racha, setRacha] = useState(0)

  useEffect(() => {
    Promise.all([
      profileService.getLogros().catch(() => ({ data: LOGROS_DATA })),
      profileService.getRacha().catch(() => ({ data: { dias: 0 } }))
    ])
      .then(([resLogros, resRacha]) => {
        const logrosData = resLogros.data || LOGROS_DATA
        setLogros(logrosData.map(l => ({
          ...l,
          actual: l.actual || (l.id === 'racha_7_dias' || l.id === 'racha_30_dias' ? resRacha.data?.dias || 0 : 0)
        })))
        setRacha(resRacha.data?.dias || 0)
      })
      .finally(() => setLoading(false))
  }, [])

  const desbloqueados = logros.filter(l => l.actual >= l.requerido)
  const bloqueados = logros.filter(l => l.actual < l.requerido)

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
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏆 Mis logros
        </h3>
        <div style={{
          background: 'rgba(255,87,34,0.15)',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Flame size={18} color="var(--color-primary)" />
          <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>🔥 {racha} días</span>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ 
          fontSize: '0.8rem', 
          color: '#00C896', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Trophy size={14} /> DESBLOQUEADOS ({desbloqueados.length})
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
          {desbloqueados.map(logro => (
            <LogroBadge
              key={logro.id}
              logro={logro}
              desbloqueado={true}
              onClick={() => setSelectedLogro(logro)}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 style={{ 
          fontSize: '0.8rem', 
          color: 'var(--color-text-muted)', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Lock size={14} /> BLOQUEADOS ({bloqueados.length})
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
          {bloqueados.map(logro => (
            <LogroBadge
              key={logro.id}
              logro={logro}
              desbloqueado={false}
              onClick={() => setSelectedLogro(logro)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedLogro && (
          <LogroModal logro={selectedLogro} onClose={() => setSelectedLogro(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}