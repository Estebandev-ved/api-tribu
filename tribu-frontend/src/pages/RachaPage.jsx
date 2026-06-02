import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, Calendar, Gift, Trophy, Star } from 'lucide-react'
import AgeVerification from '../components/AgeVerification'
import { rachaService } from '../services/services'
import { useAuth } from '../context/AuthContext'
import { formatPts, formatFecha } from '../utils/formatters'
import { getTierColor, getTierFromOrden } from '../utils/tierColors'
import Skeleton from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function RachaPage() {
  const { user } = useAuth()
  const [racha, setRacha] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      rachaService.miRacha().catch(() => ({ data: null })),
      rachaService.historialBonificaciones().catch(() => ({ data: [] }))
    ]).then(([r, h]) => {
      setRacha(r.data)
      setHistorial(h.data || [])
      setLoading(false)
    })
  }, [])

  const tierColor = getTierColor(getTierFromOrden(user?.nivelVip || 1))

  const getDiaActivo = () => {
    if (!racha?.diasActivos) return []
    return racha.diasActivos
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '5rem 1rem 2rem' }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <Skeleton h={200} r={16} />
          <Skeleton h={100} r={16} style={{ marginTop: 16 }} />
        </div>
      </div>
    )
  }

  const diasActivos = getDiaActivo()

    return (
        <AgeVerification feature="racha">
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-background, #0a0a0a)',
            paddingTop: '5rem',
            paddingBottom: '2rem'
        }}>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 1rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Flame size={28} color={tierColor.primary} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Tu Racha
            </h1>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: `linear-gradient(135deg, ${tierColor.primary}30, ${tierColor.light}10)`,
            border: `1px solid ${tierColor.primary}40`,
            borderRadius: 20,
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              fontSize: '4rem',
              fontWeight: 900,
              color: tierColor.primary,
              textShadow: `0 0 30px ${tierColor.glow}`
            }}
          >
            🔥
          </motion.div>
          
          <div style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1
          }}>
            {racha?.rachaActual || 0}
          </div>
          <p style={{ color: '#888', fontSize: '1rem', marginTop: 4 }}>
            días seguidos
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginTop: '1.5rem'
          }}>
            {DIAS_SEMANA.map((dia, idx) => (
              <motion.div
                key={dia}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: diasActivos[idx] ? tierColor.primary : 'var(--color-background-secondary, #2a2a2a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: diasActivos[idx] ? '#000' : '#666'
                }}
              >
                {diasActivos[idx] ? '✓' : dia}
              </motion.div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '0.5px solid #333' }}>
            <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>
              Récord personal: <span style={{ color: '#fff', fontWeight: 600 }}>{racha?.rachaMaxima || 0} días</span>
            </p>
          </div>
        </motion.div>

        {racha?.proximoBonus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: 'var(--color-background-primary, #1a1a1a)',
              borderRadius: 16,
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}
          >
            <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gift size={18} color={tierColor.primary} />
              Próximos bonos
            </h3>
            
            {racha.proximoBonus.map((bonus, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: 'var(--color-background-secondary, #2a2a2a)',
                borderRadius: 10,
                marginBottom: idx < racha.proximoBonus.length - 1 ? 8 : 0
              }}>
                <div>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{bonus.dias} días más</span>
                  <span style={{ color: '#888', marginLeft: 8 }}>→</span>
                  <span style={{ color: tierColor.primary, fontWeight: 700, marginLeft: 8 }}>
                    {formatPts(bonus.monto)}
                  </span>
                </div>
                <div style={{ flex: 1, marginLeft: 16 }}>
                  <div style={{
                    height: 6,
                    background: '#333',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(racha.rachaActual / bonus.dias) * 100}%` }}
                      style={{
                        height: '100%',
                        background: tierColor.primary,
                        borderRadius: 3
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={18} color={tierColor.primary} />
            Historial de bonos
          </h3>
          
          {historial.length === 0 ? (
            <EmptyState
              icon={Gift}
              titulo="Sin bonos aún"
              descripcion="Sigue manteniendo tu racha para ganar bonos"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {historial.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.875rem 1rem',
                    background: 'var(--color-background-primary, #1a1a1a)',
                    borderRadius: 12,
                    border: '0.5px solid var(--color-border-tertiary, #333)'
                  }}
                >
                  <div>
                    <p style={{ margin: 0, color: '#fff', fontWeight: 500, fontSize: '0.95rem' }}>
                      Bono de racha
                    </p>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>
                      {formatFecha(item.fecha)}
                    </p>
                  </div>
                  <span style={{ color: tierColor.primary, fontWeight: 700, fontSize: '1rem' }}>
                    +{formatPts(item.monto)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
    </AgeVerification>
  )
}
