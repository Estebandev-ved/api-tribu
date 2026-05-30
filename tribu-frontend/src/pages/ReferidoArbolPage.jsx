import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Share2, 
  ChevronRight, 
  Award,
  BarChart3,
  Network
} from 'lucide-react'
import api from '../api'
import TierBadge from '../components/TierBadge'

export default function ReferidoArbolPage() {
  const [arbol, setArbol] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('arbol')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [arbolRes, statsRes] = await Promise.all([
        api.get('/referidos/mi-arbol'),
        api.get('/referidos/stats')
      ])
      setArbol(arbolRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error('Error fetching referidos:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTierColor = (tier) => {
    switch (tier) {
      case 'ORO': return '#FFD700'
      case 'PLATA': return '#C0C0C0'
      case 'BRONCE': return '#CD7F32'
      default: return '#9CA3AF'
    }
  }

  const Nodo = ({ nodo, nivel = 0 }) => {
    if (!nodo) return null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ y: -5 }}
          style={{
            padding: '1.25rem',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            border: `1.5px solid ${nodo.activoEsteMes ? getTierColor(nodo.tier) : 'rgba(255, 255, 255, 0.08)'}`,
            boxShadow: nodo.activoEsteMes ? `0 8px 32px ${getTierColor(nodo.tier)}15` : '0 4px 15px rgba(0,0,0,0.2)',
            minWidth: '140px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            background: `linear-gradient(135deg, ${nodo.activoEsteMes ? '#FF5722' : '#333'}, ${nodo.activoEsteMes ? '#FF9800' : '#444'})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 900,
            fontSize: '1.4rem',
            margin: '0 auto 0.75rem',
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
            transform: 'rotate(-5deg)'
          }}>
            <span style={{ transform: 'rotate(5deg)' }}>{nodo.nombre?.charAt(0)}</span>
          </div>
          
          <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', margin: '0 0 0.4rem 0' }}>{nodo.nombre}</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', scale: '0.85' }}>
            <TierBadge tier={nodo.tier} />
          </div>

          <div style={{ 
            marginTop: '0.5rem', 
            fontSize: '0.7rem', 
            color: nodo.activoEsteMes ? '#00C896' : '#666',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: nodo.activoEsteMes ? '#00C896' : '#666' }}></div>
            {nodo.activoEsteMes ? 'ACTIVO' : 'INACTIVO'}
          </div>

          {nodo.rachaActual > 0 && (
            <div style={{ 
                position: 'absolute', 
                top: '-12px', 
                right: '-12px', 
                background: 'linear-gradient(135deg, #FF9800, #F44336)', 
                color: '#fff', 
                borderRadius: '10px', 
                padding: '4px 8px', 
                fontSize: '0.75rem', 
                fontWeight: 900,
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
            }}>
                🔥 {nodo.rachaActual}
            </div>
          )}
        </motion.div>
        
        {nodo.hijos && nodo.hijos.length > 0 && (
          <div style={{ display: 'flex', gap: '2.5rem', marginTop: '3rem', position: 'relative' }}>
            {/* Horizontal Line Connector */}
            <div style={{
                position: 'absolute',
                top: '-1.5rem',
                left: 'calc(100% / ' + (nodo.hijos.length * 2) + ')',
                right: 'calc(100% / ' + (nodo.hijos.length * 2) + ')',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                zIndex: 1
            }} />
            
            {nodo.hijos.map((hijo, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {/* Vertical Line Connector */}
                <div style={{
                    position: 'absolute',
                    top: '-3rem',
                    width: '2px',
                    height: '3rem',
                    background: 'rgba(255,255,255,0.06)',
                    zIndex: 1
                }} />
                <Nodo nodo={hijo} nivel={nivel + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--color-bg, #0a0a0a)',
      paddingTop: '6rem',
      paddingBottom: '4rem'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Header Section */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '3.5rem',
          position: 'relative'
        }}>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '8px 20px',
              background: 'rgba(255, 87, 34, 0.1)',
              borderRadius: '99px',
              color: '#FF5722',
              fontSize: '0.85rem',
              fontWeight: 800,
              marginBottom: '1rem',
              border: '1px solid rgba(255, 87, 34, 0.2)'
            }}>
              <Share2 size={16} /> PROGRAMA DE REFERIDOS
            </div>
            <h1 style={{ 
              fontSize: '3.5rem', 
              fontWeight: 900, 
              color: '#fff', 
              margin: 0, 
              letterSpacing: '-2px',
              lineHeight: 1
            }}>
              Red de <span style={{ color: '#FF5722' }}>Tribu</span>
            </h1>
            <p style={{ 
              color: '#888', 
              fontSize: '1.2rem', 
              marginTop: '1rem',
              maxWidth: '500px',
              margin: '1.25rem auto 0',
              lineHeight: 1.5
            }}>
              Construye tu comunidad exclusiva y desbloquea beneficios ilimitados por cada nuevo integrante.
            </p>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '3rem'
        }}>
          <div style={{ 
            display: 'flex', 
            background: 'rgba(255, 255, 255, 0.03)', 
            padding: '6px', 
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            width: 'fit-content'
          }}>
            {[
              { id: 'arbol', label: 'Mi Estructura', icon: Network },
              { id: 'stats', label: 'Estadísticas', icon: BarChart3 }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setVista(t.id)}
                style={{
                  padding: '0.8rem 1.8rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  border: 'none',
                  background: vista === t.id ? '#FF5722' : 'transparent',
                  color: vista === t.id ? '#fff' : '#666',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 2,
                  boxShadow: vista === t.id ? '0 8px 20px rgba(255, 87, 34, 0.3)' : 'none'
                }}
              >
                <t.icon size={18} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              <div style={{ height: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                <motion.div 
                  animate={{ x: ['-100%', '100%'] }} 
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }} 
                />
              </div>
            </motion.div>
          ) : vista === 'arbol' ? (
            <motion.div 
              key="arbol"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ 
                background: 'rgba(255, 255, 255, 0.01)', 
                borderRadius: '32px', 
                padding: '4rem 1rem', 
                border: '1px solid rgba(255, 255, 255, 0.03)', 
                overflowX: 'auto',
                minHeight: '500px',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              {arbol ? (
                <Nodo nodo={arbol} />
              ) : (
                <div style={{ textAlign: 'center', color: '#666', marginTop: '6rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
                    <p style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Aún no tienes referidos</p>
                    <p style={{ fontSize: '1rem', color: '#666' }}>¡Comparte tu código y haz crecer tu comunidad!</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
            >
              {/* Main Stat Card */}
              <div style={{ 
                background: 'linear-gradient(225deg, #1a1a1a, #0a0a0a)',
                borderRadius: '32px', 
                padding: '3rem', 
                border: '1.5px solid rgba(255, 255, 255, 0.05)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ 
                  position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px',
                  background: 'radial-gradient(circle, rgba(255, 87, 34, 0.15) 0%, transparent 70%)',
                  zIndex: 0
                }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#888', margin: '0 0 0.5rem 0' }}>Ganancias Totales Acumuladas</p>
                  <h2 style={{ fontSize: '4.5rem', fontWeight: 950, color: '#fff', margin: 0, letterSpacing: '-3px' }}>
                    <span style={{ fontSize: '2.5rem', verticalAlign: 'top', color: '#FF5722', marginRight: '4px' }}>$</span>
                    {stats?.totalGanancias?.toLocaleString() || 0}
                  </h2>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1.5rem', 
                    padding: '8px 16px', background: 'rgba(0, 200, 150, 0.1)', borderRadius: '12px',
                    width: 'fit-content', color: '#00C896', fontWeight: 800, fontSize: '0.9rem'
                  }}>
                    <TrendingUp size={18} /> Racha de crecimiento activa
                  </div>
                </div>

                <div style={{ 
                  width: '120px', height: '120px', borderRadius: '40px', background: 'rgba(255, 255, 255, 0.03)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF5722',
                  border: '1px solid rgba(255, 255, 255, 0.05)', position: 'relative', zIndex: 1
                }}>
                  <DollarSign size={60} strokeWidth={2.5} />
                </div>
              </div>

              {/* Grid Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                {[
                  { label: 'Total Referidos', value: stats?.totalReferidos || 0, icon: Users, color: '#3b82f6', desc: 'Comunidad total' },
                  { label: 'Activos Este Mes', value: stats?.activosEsteMes || 0, icon: Activity, color: '#00C896', desc: 'Usuarios en racha' },
                ].map((s, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -8 }}
                    style={{ 
                      background: 'rgba(255,255,255,0.02)', 
                      borderRadius: '24px', 
                      padding: '2rem', 
                      border: '1px solid rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '14px', background: `${s.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color,
                      marginBottom: '1.5rem'
                    }}>
                      <s.icon size={24} />
                    </div>
                    <p style={{ color: '#888', fontSize: '1rem', fontWeight: 600, margin: 0 }}>{s.label}</p>
                    <p style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 900, margin: '0.5rem 0' }}>{s.value}</p>
                    <p style={{ color: '#555', fontSize: '0.85rem', margin: 0 }}>{s.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* Levels & Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '28px', padding: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} color="#888" />
                    </div>
                    <p style={{ fontWeight: 800, color: '#fff', margin: 0, fontSize: '1.2rem' }}>Estructura por Niveles</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {[1, 2, 3].map(n => (
                      <div key={n} style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        background: 'rgba(255,255,255,0.01)', padding: '1.25rem', borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.03)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: n === 1 ? '#FF5722' : n === 2 ? '#FF9800' : '#FFB74D' }} />
                          <span style={{ color: '#aaa', fontWeight: 700, fontSize: '1rem' }}>Nivel {n}</span>
                        </div>
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>{stats?.[`nivel${n}Count`] || 0} <span style={{fontSize: '0.8rem', color: '#666'}}>users</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '28px', padding: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(0, 200, 150, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Award size={20} color="#00C896" />
                    </div>
                    <p style={{ fontWeight: 800, color: '#fff', margin: 0, fontSize: '1.2rem' }}>Comisiones por Nivel</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {[
                        { n: 1, p: '5%', color: '#00C896' },
                        { n: 2, p: '2%', color: '#00E676' },
                        { n: 3, p: '1%', color: '#69F0AE' }
                    ].map(item => (
                      <div key={item.n} style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        background: 'rgba(255,255,255,0.01)', padding: '1.25rem', borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.03)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#aaa', fontWeight: 700 }}>Nivel {item.n} <span style={{color: '#555'}}>({item.p})</span></span>
                        </div>
                        <span style={{ color: item.color, fontWeight: 900, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ChevronRight size={14} /> ${stats?.[`gananciasNivel${item.n}`]?.toLocaleString() || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Términos del programa de referidos */}
        <div style={{
            marginTop: '3rem',
            padding: '1.25rem',
            background: 'rgba(255, 87, 34, 0.03)',
            border: '1px solid rgba(255, 87, 34, 0.1)',
            borderRadius: '16px'
        }}>
            <h4 style={{ color: '#FF5722', fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.75rem 0' }}>
                Términos del Programa de Referidos
            </h4>
            <ul style={{
                margin: 0, paddingLeft: '1.2rem', color: '#888',
                fontSize: '0.8rem', lineHeight: 1.8
            }}>
                <li>Las comisiones se calculan sobre el valor neto de la compra del referido.</li>
                <li>Comisiones por niveles: Nivel 1 (5%), Nivel 2 (2%), Nivel 3 (1%).</li>
                <li>Las comisiones se acreditan como Puntos Tribu y están sujetas a un período de retención de 7 días.</li>
                <li>No se pagan comisiones por autorreferidos, cuentas duplicadas o actividad fraudulenta.</li>
                <li>Los Puntos Tribu no tienen valor comercial externo ni son convertibles a efectivo.</li>
                <li>Tribu se reserva el derecho de modificar o cancelar el programa en cualquier momento.</li>
                <li>Este programa cumple con la legislación colombiana aplicable (Ley 1480 de 2011).</li>
            </ul>
        </div>
      </div>
    </div>
  )
}
