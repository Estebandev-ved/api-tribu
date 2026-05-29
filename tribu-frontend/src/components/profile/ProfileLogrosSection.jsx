import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Flame, Lock, Gift, ShoppingBag, PiggyBank, Shield, Gem, Medal, Users } from 'lucide-react'
import profileService from '../../services/profileService'
import toast from 'react-hot-toast'
import { playExoticChime, playExoticClick, playEpicFanfare } from '../../utils/soundEffects'

const LOGROS_DATA = [
  { id: 'primera_compra', icon: 'shopping', iconColor: '#FF5722', titulo: 'Primera compra', descripcion: 'Realiza tu primera compra en Tribu Card', requerido: 1, actual: 0, recompensa: '5.000 pts' },
  { id: 'racha_7_dias', icon: 'flame', iconColor: '#FF9800', titulo: 'Racha de 7 días', descripcion: 'Mantén una racha de 7 días consecutivos', requerido: 7, actual: 0, recompensa: '10.000 pts' },
  { id: 'saldo_10k', icon: 'piggy', iconColor: '#E91E63', titulo: 'Ahorrador', descripcion: 'Alcanza 10.000 pts en saldo', requerido: 10000, actual: 0, recompensa: '3.000 pts' },
  { id: 'tier_plata', icon: 'shield', iconColor: '#A0A0A0', titulo: 'Tier Plata', descripcion: 'Alcanza el nivel Plata en Tribu Card', requerido: 1, actual: 0, recompensa: 'Acceso a beneficios' },
  { id: 'compra_100k', icon: 'gem', iconColor: '#00E5FF', titulo: 'Comprador 100K', descripcion: 'Acumula 100.000 pts en total', requerido: 100000, actual: 0, recompensa: '15.000 pts' },
  { id: 'racha_30_dias', icon: 'medal', iconColor: '#FFC107', titulo: 'Racha Maestra', descripcion: 'Mantén una racha de 30 días consecutivos', requerido: 30, actual: 0, recompensa: '25.000 pts' },
  { id: 'tier_oro', icon: 'trophy', iconColor: '#FFD700', titulo: 'Tier Oro', descripcion: 'Alcanza el nivel Oro en Tribu Card', requerido: 1, actual: 0, recompensa: '5% cashback' },
  { id: 'referido_activo', icon: 'users', iconColor: '#00C896', titulo: 'Embajador', descripcion: 'Consigue 3 referidos activos', requerido: 3, actual: 0, recompensa: '30.000 pts' }
]

const getLogroIcon = (iconName, size = 32, color = 'var(--color-primary)') => {
  switch (iconName) {
    case 'shopping': return <ShoppingBag size={size} color={color} />
    case 'flame': return <Flame size={size} color={color} />
    case 'piggy': return <PiggyBank size={size} color={color} />
    case 'shield': return <Shield size={size} color={color} />
    case 'gem': return <Gem size={size} color={color} />
    case 'medal': return <Medal size={size} color={color} />
    case 'trophy': return <Trophy size={size} color={color} />
    case 'users': return <Users size={size} color={color} />
    default: return <Trophy size={size} color={color} />
  }
}

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
      <div style={{ padding: '0.25rem 0' }}>
        {getLogroIcon(logro.icon || 'trophy', 32, logro.iconColor)}
      </div>
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

  useEffect(() => {
    if (logro.actual >= logro.requerido) {
      playEpicFanfare()
    } else {
      playExoticChime()
    }
  }, [logro])

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
        background: 'rgba(5, 5, 8, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30, rotateX: 10 }}
        animate={{ scale: 1, y: 0, rotateX: 0 }}
        exit={{ scale: 0.95, y: 20, rotateX: -5 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(35, 35, 45, 0.95), rgba(15, 15, 20, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.5rem',
          padding: '2.5rem 2rem 2rem',
          maxWidth: 380,
          width: '100%',
          textAlign: 'center',
          boxShadow: `0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 50px -10px ${logro.iconColor}22`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Holographic glowing ring in the background */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${logro.iconColor}15 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto 1.5rem',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          border: `2px solid ${logro.iconColor}44`,
          boxShadow: `0 0 25px ${logro.iconColor}22, inset 0 0 15px ${logro.iconColor}11`,
          zIndex: 1
        }}>
          {getLogroIcon(logro.icon || 'trophy', 48, logro.iconColor)}
        </div>

        <span style={{ 
          fontSize: '0.65rem', 
          fontWeight: 800, 
          letterSpacing: '2px', 
          color: logro.iconColor, 
          textTransform: 'uppercase',
          display: 'inline-block',
          marginBottom: '0.5rem'
        }}>
          Desafío de Logro
        </span>

        <h3 style={{ 
          color: '#fff', 
          fontSize: '1.4rem', 
          fontWeight: 700, 
          margin: '0 0 0.5rem',
          letterSpacing: '-0.5px' 
        }}>
          {logro.titulo}
        </h3>
        
        <p style={{ 
          color: 'var(--color-text-muted)', 
          fontSize: '0.85rem', 
          lineHeight: '1.4', 
          margin: '0 0 2rem',
          padding: '0 0.5rem' 
        }}>
          {logro.descripcion}
        </p>

        {logro.actual >= logro.requerido ? (
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(0, 200, 150, 0.05), rgba(0, 200, 150, 0.15))', 
            border: '1px solid rgba(0, 200, 150, 0.3)',
            borderRadius: '1rem', 
            padding: '1rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 200, 150, 0.05)'
          }}>
            <p style={{ color: '#00C896', fontWeight: 700, fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              ✓ Desbloqueado {logro.fechaDesbloqueo || 'Recientemente'}
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Progreso del Desafío</span>
              <span style={{ color: '#fff' }}>{logro.actual.toLocaleString()} / {logro.requerido.toLocaleString()}</span>
            </div>
            <div style={{ 
              height: 10, 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: 99, 
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.05)',
              position: 'relative'
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progreso}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ 
                  height: '100%', 
                  background: `linear-gradient(90deg, ${logro.iconColor}, #fff)`,
                  borderRadius: 99,
                  boxShadow: `0 0 10px ${logro.iconColor}`
                }}
              />
            </div>
          </div>
        )}

        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)',
          border: `1px dashed ${logro.iconColor}55`,
          borderRadius: '1rem',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gift size={18} color={logro.iconColor} />
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>
              Recompensa
            </span>
          </div>
          <span style={{ color: logro.iconColor, fontWeight: 700, fontSize: '1rem', letterSpacing: '0.5px' }}>
            {logro.recompensa}
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { playExoticClick(); onClose(); }}
          style={{
            background: `linear-gradient(90deg, ${logro.iconColor}, ${logro.iconColor}dd)`,
            border: 'none',
            borderRadius: '0.85rem',
            padding: '1rem 2.5rem',
            width: '100%',
            color: '#121212',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: `0 10px 25px -5px ${logro.iconColor}44`,
            transition: 'box-shadow 0.2s'
          }}
        >
          Excelente
        </motion.button>
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
      profileService.getRacha().catch(() => ({ data: { rachaActual: 0 } }))
    ])
      .then(([resLogros, resRacha]) => {
        const logrosData = resLogros.data || LOGROS_DATA
        const diasRacha = resRacha.data?.rachaActual || 0
        setLogros(logrosData.map(l => ({
          ...l,
          actual: l.actual || (l.id === 'racha_7_dias' || l.id === 'racha_30_dias' ? diasRacha : l.actual || 0)
        })))
        setRacha(diasRacha)
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
              onClick={() => { playExoticClick(); setSelectedLogro(logro) }}
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
              onClick={() => { playExoticClick(); setSelectedLogro(logro) }}
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