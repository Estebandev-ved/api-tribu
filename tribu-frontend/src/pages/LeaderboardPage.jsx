import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import TierBadge from '../components/TierBadge'
import AgeVerification from '../components/AgeVerification'

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([])
  const [miPosicion, setMiPosicion] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const [topRes, posRes] = await Promise.all([
        api.get('/leaderboard/mes-actual?limite=10'),
        api.get('/leaderboard/mi-posicion')
      ])
      setLeaderboard(topRes.data)
      setMiPosicion(posRes.data)
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTierColor = (tier) => {
    switch (tier) {
      case 'ORO': return 'from-yellow-400 to-yellow-600'
      case 'PLATA': return 'from-gray-300 to-gray-400'
      case 'BRONCE': return 'from-orange-400 to-orange-600'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  const getPodioHeight = (posicion) => {
    switch (posicion) {
      case 1: return 'h-32'
      case 2: return 'h-24'
      case 3: return 'h-20'
      default: return 'h-12'
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <AgeVerification feature="leaderboard">
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem' }}>🏆 Leaderboard</h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>Top compradores del mes</p>
      </div>

      {leaderboard.length >= 3 && (
        <div className="responsive-gap-md" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '4rem' }}>
          {[1, 0, 2].map((idx) => {
            const item = leaderboard[idx]
            const pos = item.posicion
            const isFirst = pos === 1
            return (
              <motion.div
                key={item.posicion}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    order: idx === 0 ? 2 : idx === 1 ? 1 : 3,
                    width: isFirst ? 'clamp(90px, 28vw, 120px)' : 'clamp(80px, 24vw, 100px)',
                    textAlign: 'center'
                }}
              >
                <div style={{ fontSize: isFirst ? 'clamp(2rem, 8vw, 3rem)' : 'clamp(1.6rem, 6vw, 2.5rem)', marginBottom: '0.5rem' }}>
                  {pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉'}
                </div>
                <div style={{ 
                    height: pos === 1 ? 'clamp(100px, 30vw, 140px)' : pos === 2 ? 'clamp(80px, 24vw, 110px)' : 'clamp(70px, 20vw, 90px)', 
                    width: '100%',
                    borderRadius: '12px 12px 0 0',
                    background: `linear-gradient(to top, ${pos === 1 ? '#FFD700' : pos === 2 ? '#C0C0C0' : '#CD7F32'}, transparent)`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                  <div style={{
                      width: isFirst ? 'clamp(44px, 14vw, 60px)' : 'clamp(36px, 11vw, 48px)',
                      height: isFirst ? 'clamp(44px, 14vw, 60px)' : 'clamp(36px, 11vw, 48px)',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FF5722, #FF9800)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: isFirst ? '1.5rem' : '1.2rem',
                      fontWeight: 900,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                      zIndex: 2
                  }}>
                    {item.nombre?.charAt(0)}
                  </div>
                  <div style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center', fontWeight: 900, fontSize: '1.2rem', color: '#fff', zIndex: 2 }}>
                    #{pos}
                  </div>
                </div>
                <p style={{ marginTop: '0.75rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 700 }}>${item.totalCompras?.toLocaleString()}</p>
              </motion.div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {leaderboard.map((item, idx) => (
          <motion.div
            key={item.usuarioId}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 1.5rem',
              borderRadius: '16px',
              background: miPosicion?.usuarioId === item.usuarioId 
                ? 'rgba(255, 87, 34, 0.15)' 
                : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${miPosicion?.usuarioId === item.usuarioId ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)'}`,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 900,
                background: item.posicion <= 3 
                    ? 'linear-gradient(135deg, #FFD700, #FF9800)' 
                    : 'rgba(255,255,255,0.05)',
                color: item.posicion <= 3 ? '#000' : '#888'
            }}>
              {item.posicion}
            </div>
            <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #444, #222)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#fff', 
                fontWeight: 800,
                fontSize: '1.2rem',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {item.nombre?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, color: '#fff', margin: 0 }}>{item.nombre}</p>
              <TierBadge tier={item.tier} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 900, color: '#fff', margin: 0, fontSize: '1.1rem' }}>${item.totalCompras?.toLocaleString()}</p>
              {item.rachaActual > 0 && (
                <p style={{ fontSize: '0.75rem', color: '#FF5722', margin: 0, fontWeight: 700 }}>🔥 {item.rachaActual} días</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {miPosicion && !leaderboard.find(l => l.usuarioId === miPosicion.usuarioId) && (
        <div style={{ 
            marginTop: '2.5rem', 
            padding: '1.5rem', 
            background: 'rgba(255, 87, 34, 0.1)', 
            borderRadius: '20px', 
            border: '1px solid rgba(255, 87, 34, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        }}>
          <p style={{ color: '#888', margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Tu posición actual:</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 900, 
                color: '#fff' 
            }}>
              {miPosicion.posicion || '-'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, color: '#fff', margin: 0 }}>{user?.nombreCompleto}</p>
              <TierBadge tier={miPosicion.tier} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 900, color: '#fff', margin: 0, fontSize: '1.1rem' }}>${miPosicion.totalCompras?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
    </AgeVerification>
  )
}
