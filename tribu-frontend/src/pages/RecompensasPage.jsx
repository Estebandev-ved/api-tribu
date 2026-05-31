import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, Sparkles, Ticket, Lock, CheckCircle } from 'lucide-react'
import OptimizedImage from '../components/OptimizedImage'
import { getMiPerfil, getRecompensas, canjearRecompensa, getMisCanjes, getLogros } from '../api'
import { toast } from 'react-hot-toast'

const cardStyles = {
  background: 'var(--color-card-bg)',
  border: '1px solid var(--color-card-border)',
  borderRadius: 20,
  padding: '1.25rem'
}

const formatPts = (n) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n || 0) + ' pts'

export default function RecompensasPage() {
  const [cargando, setCargando] = useState(true)
  const [recompensas, setRecompensas] = useState([])
  const [canjes, setCanjes] = useState([])
  const [perfil, setPerfil] = useState(null)
  const [logros, setLogros] = useState([])
  const [canjeandoId, setCanjeandoId] = useState(null)
  const [activeTab, setActiveTab] = useState('catalogo')

  useEffect(() => {
    let mounted = true
    Promise.all([getRecompensas(), getMisCanjes(), getMiPerfil(), getLogros()])
      .then(([r, c, p, l]) => {
        if (!mounted) return
        setRecompensas(r.data || [])
        setCanjes(c.data || [])
        setPerfil(p.data)
        setLogros(l.data || [])
      })
      .catch(() => {})
      .finally(() => mounted && setCargando(false))
    return () => { mounted = false }
  }, [])

  const saldo = perfil?.saldoFavor || 0

  const canjesLookup = useMemo(() => {
    const map = new Map()
    canjes.forEach(c => map.set(c.recompensaId, c))
    return map
  }, [canjes])

  const handleCanje = async (recompensa) => {
    if (canjeandoId) return
    setCanjeandoId(recompensa.id)
    try {
      const res = await canjearRecompensa(recompensa.id)
      setCanjes(prev => [res.data, ...prev])
      setPerfil(prev => ({ ...prev, saldoFavor: (prev?.saldoFavor || 0) - recompensa.costoPuntos }))
      toast.success('Recompensa canjeada con éxito')
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo canjear la recompensa')
    } finally {
      setCanjeandoId(null)
    }
  }

  const copiarCodigo = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles');
  };

  if (cargando) {
    return <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)' }}>Cargando...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingTop: '4.5rem', paddingBottom: '4rem' }}>
      <div className="container" style={{ maxWidth: 980 }}>
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255, 87, 34, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gift size={26} color="#FF7A1A" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, color: 'var(--color-text)', fontSize: '1.8rem', fontWeight: 800 }}>Recompensas Tribu</h1>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)' }}>Canjea tus puntos por premios exclusivos y haz seguimiento de tus misiones.</p>
          </div>
          <div style={{ background: 'var(--color-card-bg-soft)', borderRadius: 14, padding: '0.6rem 1rem', border: '1px solid var(--color-card-border)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Saldo Puntos</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>{formatPts(saldo)}</div>
          </div>
        </div>

        {/* Dynamic Tabs Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <button 
            onClick={() => setActiveTab('catalogo')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'catalogo' ? '#FF7A1A' : '#888',
              fontSize: '1.05rem',
              fontWeight: 700,
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color 0.2s',
              flexShrink: 0
            }}
          >
            Catálogo de Premios
            {activeTab === 'catalogo' && (
              <motion.div layoutId="activeTabUnderline" style={{ position: 'absolute', bottom: -9, left: 0, right: 0, height: 3, background: '#FF7A1A', borderRadius: 2 }} />
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('misiones')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'misiones' ? '#FBBF24' : '#888',
              fontSize: '1.05rem',
              fontWeight: 700,
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color 0.2s',
              flexShrink: 0
            }}
          >
            Misiones (Cómo ganar puntos)
            {activeTab === 'misiones' && (
              <motion.div layoutId="activeTabUnderline" style={{ position: 'absolute', bottom: -9, left: 0, right: 0, height: 3, background: '#FBBF24', borderRadius: 2 }} />
            )}
          </button>

          <button 
            onClick={() => setActiveTab('mis-canjes')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'mis-canjes' ? '#7dd3fc' : '#888',
              fontSize: '1.05rem',
              fontWeight: 700,
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color 0.2s',
              flexShrink: 0
            }}
          >
            Mis Premios Canjeados ({canjes.length})
            {activeTab === 'mis-canjes' && (
              <motion.div layoutId="activeTabUnderline" style={{ position: 'absolute', bottom: -9, left: 0, right: 0, height: 3, background: '#7dd3fc', borderRadius: 2 }} />
            )}
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'catalogo' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Catalog Grid */}
            <div style={cardStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <Sparkles size={18} color="#FBBF24" />
                <div style={{ color: 'var(--color-text)', fontWeight: 700, fontSize: '1.1rem' }}>Premios Disponibles</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem' }}>
                {recompensas.map((r) => {
                  const canje = canjesLookup.get(r.id)
                  const sinStock = r.stock !== null && r.stock !== undefined && r.stock <= 0
                  const sinSaldo = saldo < r.costoPuntos
                  const disabled = sinStock || sinSaldo
                  return (
                    <div key={r.id} style={{ background: 'var(--color-card-bg-soft)', borderRadius: 16, padding: '1rem', border: '1px solid var(--color-card-border)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ height: 120, borderRadius: 12, background: 'linear-gradient(135deg, rgba(255,122,26,0.2), rgba(255,255,255,0.02))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <OptimizedImage src={r.imagenUrl} alt={r.titulo} fallback={<Ticket size={34} color="#FF7A1A" />} />
                      </div>
                      <div style={{ color: 'var(--color-text)', fontWeight: 700, fontSize: '1rem' }}>{r.titulo}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', minHeight: 40 }}>{r.descripcion || 'Recompensa exclusiva Tribu.'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 800, color: 'var(--color-text)' }}>{formatPts(r.costoPuntos)}</div>
                        {r.stock !== null && r.stock !== undefined && (
                          <div style={{ fontSize: 12, color: r.stock <= 3 ? '#ffb84d' : '#7dd3fc' }}>Stock {r.stock}</div>
                        )}
                      </div>
                      {canje ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00C896', fontWeight: 700, fontSize: '0.85rem', padding: '0.5rem 0', justifyContent: 'center' }}>
                          <CheckCircle size={14} /> Canjeado
                        </div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: disabled ? 1 : 1.02 }}
                          whileTap={{ scale: disabled ? 1 : 0.98 }}
                          disabled={disabled || canjeandoId === r.id}
                          onClick={() => handleCanje(r)}
                          style={{
                            border: 'none',
                            borderRadius: 12,
                            padding: '0.65rem 0.8rem',
                            fontWeight: 800,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            background: disabled ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #FF7A1A, #FBBF24)',
                            color: disabled ? '#888' : '#1A1A1A'
                          }}
                        >
                          {sinStock ? 'Agotado' : sinSaldo ? 'Saldo insuficiente' : canjeandoId === r.id ? 'Canjeando...' : 'Canjear ahora'}
                        </motion.button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sidebar info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={cardStyles}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  <Ticket size={18} color="#7dd3fc" />
                  <div style={{ color: 'var(--color-text)', fontWeight: 700 }}>Resumen de Cuenta</div>
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Canjea tus puntos acumulados por cualquiera de los premios de nuestro catálogo. 
                  Una vez canjeado, recibirás un <strong>código único</strong> para reclamar tu premio.
                </div>
                <div style={{ marginTop: '1.2rem', padding: '1rem', background: 'var(--color-card-bg-soft)', borderRadius: '12px', border: '1px solid var(--color-card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Puntos totales:</span>
                    <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{formatPts(saldo)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Premios canjeados:</span>
                    <span style={{ color: '#7dd3fc', fontWeight: 700 }}>{canjes.length}</span>
                  </div>
                </div>
              </div>

              <div style={{ ...cardStyles, background: 'var(--color-card-bg-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                  <Lock size={16} color="#FFB84D" />
                  <div style={{ color: 'var(--color-text)', fontWeight: 700 }}>Reglas de uso</div>
                </div>
                <ul style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0, paddingLeft: '1.1rem' }}>
                  <li>Los puntos solo se usan dentro de la plataforma Tribu.</li>
                  <li>Los canjes no se pueden revertir una vez confirmados.</li>
                  <li>El stock puede variar según disponibilidad.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Achievements and Missions */}
        {activeTab === 'misiones' && (
          <div style={cardStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <Sparkles size={18} color="#FBBF24" />
              <div style={{ color: 'var(--color-text)', fontWeight: 700, fontSize: '1.1rem' }}>Misiones y Logros Tribu</div>
            </div>

            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Completa las siguientes misiones especiales dentro de la plataforma para desbloquear recompensas instantáneas en tu saldo Tribu Card. ¡Tus progresos se actualizan en tiempo real con tus acciones!
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
              {logros.map((l) => {
                const completado = l.actual >= l.requerido;
                const porcentaje = Math.min(100, Math.max(0, (l.actual / l.requerido) * 100));

                return (
                  <motion.div
                    key={l.id}
                    whileHover={{ scale: 1.01 }}
                    style={{
                      background: completado 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(10, 10, 10, 0.6))'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(10,10,10,0.65))',
                      border: completado
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 20,
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.8rem',
                      position: 'relative',
                      boxShadow: completado ? '0 0 15px rgba(16, 185, 129, 0.05)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Header: Emoji and Reward Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.8rem' }}>{l.emoji || '🎯'}</span>
                        <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>
                          {l.titulo}
                        </h4>
                      </div>
                      
                      {/* Reward Badge */}
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        background: completado ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.12)',
                        color: completado ? '#10B981' : '#FBBF24',
                        border: completado ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(251, 191, 36, 0.2)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                      }}>
                        {l.recompensa}
                      </span>
                    </div>

                    {/* Description */}
                      <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.88rem', lineHeight: 1.45, minHeight: '38px' }}>
                        {l.descripcion}
                      </p>

                    {/* Progress Bar and Indicator */}
                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                        <span style={{ color: completado ? '#10B981' : 'var(--color-text-muted)', fontWeight: completado ? 700 : 500 }}>
                          {completado ? '¡Misión Completada!' : 'Progreso de misión'}
                        </span>
                        <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>
                          {l.id === 'saldo_10k' || l.id === 'compra_100k' 
                            ? `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(l.actual)} / $${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(l.requerido)}`
                            : `${l.actual} / ${l.requerido}`}
                        </span>
                      </div>

                      {/* Bar Wrapper */}
                      <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${porcentaje}%`,
                          background: completado
                            ? 'linear-gradient(90deg, #10B981, #34D399)'
                            : 'linear-gradient(90deg, #FF7A1A, #FBBF24)',
                          borderRadius: 10,
                          transition: 'width 0.5s ease-out'
                        }} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Won/Claimed Rewards Grid Full Width */}
        {activeTab === 'mis-canjes' && (
          <div style={cardStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <CheckCircle size={18} color="#00C896" />
              <div style={{ color: 'var(--color-text)', fontWeight: 700, fontSize: '1.1rem' }}>Tus Códigos y Premios Obtenidos</div>
            </div>

            {canjes.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--color-card-bg-soft)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
                <Ticket size={48} color="rgba(0,0,0,0.25)" style={{ marginBottom: '1rem' }} />
                <h4 style={{ color: 'var(--color-text)', margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Aún no tienes premios canjeados</h4>
                <p style={{ color: 'var(--color-text-muted)', margin: '0 0 1.5rem 0' }}>Explora el catálogo y canjea tus primeros puntos.</p>
                <button 
                  onClick={() => setActiveTab('catalogo')}
                  style={{
                    background: 'linear-gradient(135deg, #FF7A1A, #FBBF24)',
                    border: 'none',
                    borderRadius: 12,
                    padding: '0.65rem 1.5rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                      color: '#1A1A1A'
                  }}
                >
                  Ir al catálogo
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.2rem' }}>
                {canjes.map(c => (
                  <motion.div
                    key={c.id}
                    whileHover={{ scale: 1.01 }}
                    style={{
                      background: 'var(--color-card-bg)',
                      border: '1px solid rgba(125, 211, 252, 0.2)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.2rem',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    {/* Glowing effect line on the left side of the card */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      background: c.estado === 'ENTREGADO' || c.estado === 'COMPLETADO' 
                        ? 'linear-gradient(to bottom, #00C896, #009688)' 
                        : 'linear-gradient(to bottom, #ffb84d, #f59e0b)'
                    }} />

                    {/* Voucher Image */}
                    <div style={{ width: '70px', height: '70px', borderRadius: '12px', background: 'var(--color-card-bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--color-card-border)' }}>
                      {c.recompensaImagen ? (
                        <img src={c.recompensaImagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                      ) : (
                        <Ticket size={28} color="#7dd3fc" />
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', gap: '0.5rem' }}>
                        <h4 style={{ margin: 0, color: 'var(--color-text)', fontSize: '1.05rem', fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                          {c.recompensaTitulo}
                        </h4>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: c.estado === 'ENTREGADO' || c.estado === 'COMPLETADO' ? 'rgba(0, 200, 150, 0.1)' : 'rgba(255, 184, 77, 0.1)',
                          color: c.estado === 'ENTREGADO' || c.estado === 'COMPLETADO' ? '#00C896' : '#ffb84d',
                          border: `1px solid ${c.estado === 'ENTREGADO' || c.estado === 'COMPLETADO' ? 'rgba(0, 200, 150, 0.2)' : 'rgba(255, 184, 77, 0.2)'}`,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '20px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          whiteSpace: 'nowrap'
                        }}>
                          {c.estado || 'PENDIENTE'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.6rem' }}>
                        Canjeado: {new Date(c.fecha).toLocaleDateString('es-CO')} · {formatPts(c.costoPuntos)}
                      </div>

                      {/* Claim Code Section */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-card-bg-soft)', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid var(--color-card-border)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>CÓDIGO:</span>
                        <code style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1d4ed8', letterSpacing: '1px', flex: 1, fontFamily: 'monospace' }}>
                          {c.codigoCanje}
                        </code>
                        <button
                          onClick={() => copiarCodigo(c.codigoCanje)}
                          style={{
                            background: 'var(--color-card-bg-soft)',
                            border: '1px solid var(--color-card-border)',
                            borderRadius: '4px',
                            color: 'var(--color-text)',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.4rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-card-bg-soft)' }}
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
