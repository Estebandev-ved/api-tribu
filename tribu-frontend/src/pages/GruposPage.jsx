import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, LogIn, ArrowLeft, Search, Gift, ShoppingCart, CreditCard, Pizza, Tv, Sparkles, ShieldCheck, HelpCircle } from 'lucide-react'
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
  const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: '', emoji: '🍕', productos: [], montoTotal: '' })

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

  const handleCrear = async () => {
    if (!nuevoGrupo.nombre) return
    setUniendo(true)
    try {
      const res = await grupoService.crear({
        nombre: nuevoGrupo.nombre,
        emoji: nuevoGrupo.emoji,
        montoTotal: nuevoGrupo.montoTotal ? parseFloat(nuevoGrupo.montoTotal) : 0
      })
      alert(`¡Grupo creado con éxito!\nCódigo de invitación: ${res.data.codigoInvitacion}\nComparte este código con tus amigos para que se unan.`)
      setNuevoGrupo({ nombre: '', emoji: '🍕', productos: [], montoTotal: '' })
      setTab('mis-grupos')
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear el grupo')
    } finally {
      setUniendo(false)
    }
  }

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

        {/* Onboarding de Compra Grupal - Premium Glassmorphism */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.09) 0%, rgba(255, 152, 0, 0.03) 100%)',
          border: '1px solid rgba(255, 87, 34, 0.18)',
          borderRadius: 20,
          padding: '1.75rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
            <div style={{
              background: 'linear-gradient(45deg, #FF5722, #FF9800)',
              borderRadius: '12px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(255, 87, 34, 0.25)'
            }}>
              <Users size={22} color="#fff" />
            </div>
            <div>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                Guía de Compra Grupal en Tribu
              </h3>
              <p style={{ color: '#888', fontSize: '0.75rem', margin: 0 }}>
                Divide cuentas y compra en equipo de forma inteligente
              </p>
            </div>
          </div>

          <p style={{ color: '#ccc', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
            La Compra Grupal te permite unirte con tu Tribu de amigos, compañeros de universidad o colegas de oficina. Facilitamos la selección de productos y la <strong>división equitativa o personalizada de la cuenta</strong>.
          </p>

          {/* Sección: ¿Qué se puede comprar? */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h4 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <HelpCircle size={16} color="#FF5722" />
              ¿Qué pueden comprar en Grupo?
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 14,
                padding: '0.85rem',
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                transition: 'background 0.3s ease'
              }}>
                <div style={{ background: 'rgba(255,87,34,0.1)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                  <Pizza size={18} color="#FF5722" />
                </div>
                <div>
                  <h5 style={{ color: '#fff', fontSize: '0.78rem', margin: 0, fontWeight: 700 }}>Comidas y Almuerzos</h5>
                  <p style={{ color: '#777', fontSize: '0.68rem', margin: '2px 0 0 0' }}>Pidan hamburguesas o pizzas en equipo.</p>
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 14,
                padding: '0.85rem',
                display: 'flex',
                gap: 10,
                alignItems: 'center'
              }}>
                <div style={{ background: 'rgba(255,87,34,0.1)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                  <Gift size={18} color="#FF5722" />
                </div>
                <div>
                  <h5 style={{ color: '#fff', fontSize: '0.78rem', margin: 0, fontWeight: 700 }}>Regalos de Cumpleaños</h5>
                  <p style={{ color: '#777', fontSize: '0.68rem', margin: '2px 0 0 0' }}>Júntense para ese regalo especial.</p>
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 14,
                padding: '0.85rem',
                display: 'flex',
                gap: 10,
                alignItems: 'center'
              }}>
                <div style={{ background: 'rgba(255,87,34,0.1)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                  <Tv size={18} color="#FF5722" />
                </div>
                <div>
                  <h5 style={{ color: '#fff', fontSize: '0.78rem', margin: 0, fontWeight: 700 }}>Suscripciones y Vouchers</h5>
                  <p style={{ color: '#777', fontSize: '0.68rem', margin: '2px 0 0 0' }}>Compartan Spotify o Netflix.</p>
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 14,
                padding: '0.85rem',
                display: 'flex',
                gap: 10,
                alignItems: 'center'
              }}>
                <div style={{ background: 'rgba(255,87,34,0.1)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                  <Sparkles size={18} color="#FF5722" />
                </div>
                <div>
                  <h5 style={{ color: '#fff', fontSize: '0.78rem', margin: 0, fontWeight: 700 }}>Membresías Premium</h5>
                  <p style={{ color: '#777', fontSize: '0.68rem', margin: '2px 0 0 0' }}>Paguen su membresía Tribu Pass.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Paso a Paso */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: 16,
            padding: '1.15rem',
            border: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <h4 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.9rem' }}>
              ⚙️ ¿Cómo funciona el proceso?
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #FF5722, #FF9800)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  flexShrink: 0,
                  marginTop: 2
                }}>1</div>
                <div>
                  <h5 style={{ color: '#fff', fontSize: '0.82rem', margin: 0, fontWeight: 700 }}>Creas o te Unes</h5>
                  <p style={{ color: '#888', fontSize: '0.74rem', margin: '2px 0 0 0', lineHeight: 1.4 }}>Fija un nombre y presupuesto para tu grupo, o únete usando el código de invitación <strong>TRB-XXXX</strong>.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #FF5722, #FF9800)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  flexShrink: 0,
                  marginTop: 2
                }}>2</div>
                <div>
                  <h5 style={{ color: '#fff', fontSize: '0.82rem', margin: 0, fontWeight: 700 }}>Divides la Cuenta (Split)</h5>
                  <p style={{ color: '#888', fontSize: '0.74rem', margin: '2px 0 0 0', lineHeight: 1.4 }}>El creador del grupo decide si la división será equitativa (mismo monto para todos) o personalizada por integrante.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #FF5722, #FF9800)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  flexShrink: 0,
                  marginTop: 2
                }}>3</div>
                <div>
                  <h5 style={{ color: '#fff', fontSize: '0.82rem', margin: 0, fontWeight: 700 }}>Pago Grupal en Tiempo Real</h5>
                  <p style={{ color: '#888', fontSize: '0.74rem', margin: '2px 0 0 0', lineHeight: 1.4 }}>Cada miembro paga su parte desde su billetera con sus Puntos Tribu. El pedido se aprueba cuando el total esté cubierto al 100%.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Garantía */}
          <div style={{
            marginTop: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            background: 'rgba(76, 175, 80, 0.06)',
            border: '1px solid rgba(76, 175, 80, 0.18)',
            borderRadius: 12,
            padding: '10px 14px'
          }}>
            <ShieldCheck size={18} color="#81c784" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: '#81c784', fontSize: '0.75rem', margin: 0, lineHeight: 1.4 }}>
              <strong>Garantía de Reembolso Seguro:</strong> Si un grupo no se llega a completar o expira el presupuesto, todos los puntos aportados por cada miembro se devuelven de inmediato a sus billeteras sin cargos adicionales.
            </p>
          </div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1, 2, 3].map((n) => (
                    <div 
                      key={n} 
                      className="skeleton-box" 
                      style={{ 
                        height: 120, 
                        width: '100%', 
                        borderRadius: 14,
                        opacity: 0.15 
                      }} 
                    />
                  ))}
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
                    <GrupoCard 
                      key={grupo.id} 
                      grupo={grupo} 
                      index={idx} 
                      onPaymentSuccess={() => {
                        grupoService.misGrupos().then(res => setGrupos(res.data || []))
                      }} 
                    />
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
                    Monto Objetivo / Presupuesto Total (COP)
                  </label>
                  <input
                    type="number"
                    value={nuevoGrupo.montoTotal}
                    onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, montoTotal: e.target.value })}
                    placeholder="Ej. 60000"
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
                  whileHover={{ scale: (nuevoGrupo.nombre && !uniendo) ? 1.02 : 1 }}
                  whileTap={{ scale: (nuevoGrupo.nombre && !uniendo) ? 0.98 : 1 }}
                  disabled={!nuevoGrupo.nombre || uniendo}
                  onClick={handleCrear}
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
                  {uniendo ? 'Creando Grupo...' : 'Crear Grupo'}
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
