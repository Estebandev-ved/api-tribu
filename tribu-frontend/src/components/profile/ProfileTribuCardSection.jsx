import { motion } from 'framer-motion'
import { CreditCard, TrendingUp, Gift, CheckCircle, Lock } from 'lucide-react'
import { TIER_COLORS } from '../../utils/tierColors'
import { playExoticClick } from '../../utils/soundEffects'

export default function ProfileTribuCardSection({ perfil }) {
  const tier = perfil?.tier || 'BRONCE'
  const tierColor = TIER_COLORS[tier]?.primary || '#cd7f32'
  const saldo = perfil?.saldoFavor || 0
  const hasTribuPass = perfil?.tribuPassActiva === true;
  
  const baseCashbackRate = tier === 'ORO' ? 5 : tier === 'PLATA' ? 4 : 3
  const cashbackRate = baseCashbackRate * (hasTribuPass ? 2 : 1)
  
  const gastadoMes = perfil?.gastadoMes || 0
  const metaSiguiente = tier === 'BRONCE' ? 500000 : tier === 'PLATA' ? 1000000 : 2000000
  const proximoTier = tier === 'BRONCE' ? 'PLATA' : tier === 'PLATA' ? 'ORO' : null
  const progreso = Math.min((gastadoMes / metaSiguiente) * 100, 100)

  const beneficiosActuales = [
    { label: `Cashback ${cashbackRate}% en todas tus compras`, disponible: true },
    { label: hasTribuPass ? 'Ruleta diaria hasta 15.000 pts (Tribu Pass 💎)' : 'Ruleta diaria hasta 10.000 pts', disponible: true },
    { label: 'Acceso a compras grupales', disponible: true },
    { label: 'Envío gratis ilimitado a nivel nacional', disponible: hasTribuPass || tier === 'ORO', tier: 'ORO' }
  ]

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
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '1.5rem' }}>
        💳 Mi Tribu Card
      </h3>

      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={playExoticClick}
        style={{
          background: hasTribuPass
            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)'
            : `linear-gradient(135deg, ${tierColor}30, ${tierColor}10)`,
          border: hasTribuPass
            ? '1px solid rgba(124, 58, 237, 0.5)'
            : `1px solid ${tierColor}40`,
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: hasTribuPass
            ? '0 8px 32px 0 rgba(124, 58, 237, 0.2)'
            : `0 8px 32px 0 ${tierColor}10`
        }}
      >
        <div style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: hasTribuPass
            ? 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)'
            : `radial-gradient(circle, ${tierColor}40 0%, transparent 70%)`
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <CreditCard size={32} color={hasTribuPass ? '#a855f7' : tierColor} />
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{
              background: tierColor,
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              {tier}
            </span>
            {hasTribuPass && (
              <span style={{
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: 800,
                boxShadow: '0 0 10px rgba(124, 58, 237, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                💎 TRIBU PASS
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: '0 0 0.25rem' }}>Puntos disponibles</p>
            <p style={{ color: 'var(--color-text)', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {saldo.toLocaleString('es-CO')} pts
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: '0 0 0.25rem' }}>Cashback rate</p>
            <p style={{ color: 'var(--color-text)', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {cashbackRate}%
            </p>
          </div>
        </div>
      </motion.div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ 
          fontSize: '0.8rem', 
          color: 'var(--color-text-muted)', 
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <TrendingUp size={14} /> PROGRESO AL SIGUIENTE NIVEL
        </h4>
        
        <div style={{ 
          background: 'rgba(30,30,30,0.8)', 
          borderRadius: '0.5rem', 
          padding: '1rem' 
        }}>
          <p style={{ color: 'var(--color-text)', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>
            Llevas acumulados <strong>{gastadoMes.toLocaleString('es-CO')} pts</strong> este mes
          </p>
          {proximoTier && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: '0 0 0.75rem' }}>
              Faltan <strong>{Math.max(0, metaSiguiente - gastadoMes).toLocaleString('es-CO')} pts</strong> para {proximoTier}
            </p>
          )}
          
          <div style={{ 
            height: 8, 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: 4, 
            overflow: 'hidden',
            marginBottom: '0.5rem'
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progreso}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ 
                height: '100%', 
                background: `linear-gradient(90deg, ${tierColor}, ${tierColor}dd)`,
                borderRadius: 4
              }}
            />
          </div>
          
          <p style={{ color: 'var(--color-text-faint)', fontSize: '0.75rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={12} /> {Math.round(progreso)}%
          </p>
          
          {metaSiguiente - gastadoMes <= 200000 && (
            <p style={{ 
              color: '#00C896', 
              fontSize: '0.8rem', 
              margin: '0.75rem 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Gift size={14} /> ¡Acumula {Math.max(0, metaSiguiente - gastadoMes).toLocaleString('es-CO')} pts más para subir de nivel!
            </p>
          )}
        </div>
      </div>

      <div>
        <h4 style={{ 
          fontSize: '0.8rem', 
          color: 'var(--color-text-muted)', 
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle size={14} /> MIS BENEFICIOS ACTUALES
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {beneficiosActuales.map((ben, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                background: ben.disponible ? 'rgba(0,200,150,0.1)' : 'rgba(255,255,255,0.03)'
              }}
            >
              {ben.disponible ? (
                <CheckCircle size={16} color="#00C896" />
              ) : (
                <Lock size={16} color="var(--color-text-faint)" />
              )}
              <span style={{
                color: ben.disponible ? 'var(--color-text)' : 'var(--color-text-faint)',
                fontSize: '0.85rem',
                flex: 1
              }}>
                {ben.label}
              </span>
              {!ben.disponible && (
                <span style={{
                  color: 'var(--color-text-faint)',
                  fontSize: '0.7rem',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {ben.tier}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}