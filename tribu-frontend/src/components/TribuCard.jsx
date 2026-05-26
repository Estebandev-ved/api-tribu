import { useRef, useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'

const TIER_LABELS = {
  1: 'BRONCE',
  2: 'PLATA',
  3: 'ORO'
}

const TIER_THEMES = {
  BRONCE: {
    gradient: 'linear-gradient(135deg, #A85A32 0%, #D4926A 40%, #8A401B 100%)',
    textBrand: '#421A00',
    tierPillColor: '#3D1900',
    chipCell: 'rgba(80,30,0,0.25)',
    cardNumber: '#5C2807',
    balanceLabel: '#6E320D',
    balanceAmount: '#2E1000',
    balanceUnit: '#5C2807',
    progressText: '#6E320D',
    progressBarFill: '#3D1900',
    progressBarBg: 'rgba(255,255,255,0.3)',
    shadow: '0 20px 50px rgba(138,64,27,0.3), inset 0 0 0 1px rgba(255,255,255,0.2)'
  },
  PLATA: {
    gradient: 'linear-gradient(135deg, #A1A8BA 0%, #E1E5EE 40%, #7F889B 100%)',
    textBrand: '#20273a',
    tierPillColor: '#1C2030',
    chipCell: 'rgba(40,50,70,0.25)',
    cardNumber: '#3A4155',
    balanceLabel: '#4A5168',
    balanceAmount: '#101420',
    balanceUnit: '#3A4155',
    progressText: '#4A5168',
    progressBarFill: '#1C2030',
    progressBarBg: 'rgba(255,255,255,0.4)',
    shadow: '0 20px 50px rgba(127,136,155,0.3), inset 0 0 0 1px rgba(255,255,255,0.3)'
  },
  ORO: {
    gradient: 'linear-gradient(135deg, #E8A820 0%, #F5C842 40%, #D4920A 100%)',
    textBrand: '#4a3000',
    tierPillColor: '#3a2500',
    chipCell: 'rgba(100,60,0,0.25)',
    cardNumber: '#5a3c00',
    balanceLabel: '#6b4500',
    balanceAmount: '#2a1800',
    balanceUnit: '#5a3c00',
    progressText: '#6b4500',
    progressBarFill: '#3a2500',
    progressBarBg: 'rgba(255,255,255,0.3)',
    shadow: '0 20px 50px rgba(232,168,32,0.4), inset 0 0 0 1px rgba(255,255,255,0.35)'
  }
}

export default function TribuCard({ saldo, animarSaldo, tierActual, cardNumber, onFlip }) {
  const cardRef = useRef(null)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  
  const rotateX = useTransform(mouseY, [0, 1], [15, -15])
  const rotateY = useTransform(mouseX, [0, 1], [-15, 15])
  
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 })
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 })
  
  const overlayX = useTransform(mouseX, [0, 1], ['-20%', '120%'])
  
  const [saldoAnimado, setSaldoAnimado] = useState(saldo)

  useEffect(() => {
    setSaldoAnimado(saldo)
  }, [saldo])

  const nivelVip = tierActual?.orden || 1
  const tierName = TIER_LABELS[nivelVip] || 'BRONCE'
  const theme = TIER_THEMES[tierName] || TIER_THEMES.BRONCE

  useEffect(() => {
    if (!animarSaldo || saldo === saldoAnimado) return

    const duration = 800
    const startTime = performance.now()
    const startValue = saldoAnimado
    const endValue = saldo

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOut)
      
      setSaldoAnimado(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [animarSaldo, saldo])

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0.5)
    mouseY.set(0.5)
  }

  const formatCurrencyWithoutUnit = (monto) => 
    new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(monto ?? 0)

  const getProgressInfo = () => {
    if (tierName === 'BRONCE') {
      const target = 50000
      const pct = Math.min(Math.round((saldo / target) * 100), 100)
      return { label: 'Progreso hacia Plata', pct }
    } else if (tierName === 'PLATA') {
      const target = 250000
      const pct = Math.min(Math.round((saldo / target) * 100), 100)
      return { label: 'Progreso hacia Oro', pct }
    } else {
      const target = 1000000
      const pct = Math.min(Math.round((saldo / target) * 100), 100)
      return { label: 'Progreso hacia Platino', pct }
    }
  }

  const progress = getProgressInfo()
  const displayCardNumber = cardNumber || '•••• •••• •••• 1234'

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onFlip}
      style={{ perspective: '1000px', cursor: onFlip ? 'pointer' : 'default', width: '100%', display: 'flex', justifyContent: 'center' }}
    >
      <motion.div
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: '20px',
          background: theme.gradient,
          position: 'relative',
          overflow: 'hidden',
          transformStyle: 'preserve-3d',
          rotateX: springRotateX,
          rotateY: springRotateY,
          willChange: 'transform',
          boxShadow: theme.shadow,
          padding: '1.5rem',
        }}
        layoutId="tribu-card"
      >
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)',
            backgroundPosition: overlayX,
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.25) 0%, transparent 40%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-20%', width: '150%', height: '150%', background: tierName === 'ORO' ? 'radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.4) 0%, transparent 50%)' : 'radial-gradient(circle at bottom right, rgba(255, 87, 34, 0.2) 0%, transparent 50%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: theme.balanceAmount }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ width: '34px', height: '26px', borderRadius: '5px', background: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justify: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', width: '22px', height: '18px' }}>
                  <div style={{ background: theme.chipCell, borderRadius: '1px' }} />
                  <div style={{ background: theme.chipCell, borderRadius: '1px' }} />
                  <div style={{ background: theme.chipCell, borderRadius: '1px' }} />
                  <div style={{ background: theme.chipCell, borderRadius: '1px' }} />
                </div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.12em', color: theme.textBrand }}>TRIBU</div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ background: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', color: theme.tierPillColor, letterSpacing: '0.06em', display: 'inline-block' }}>
                ✦ {tierName}
              </div>
              <div style={{ fontSize: '11px', color: theme.cardNumber, marginTop: '8px', opacity: 0.8, letterSpacing: '1px', fontFamily: 'monospace' }}>
                {displayCardNumber}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.balanceLabel, opacity: 0.8, marginBottom: '2px' }}>
              Balance actual
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <div style={{ fontSize: '30px', fontWeight: 700, color: theme.balanceAmount, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                {formatCurrencyWithoutUnit(saldoAnimado)}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: theme.balanceUnit, marginLeft: '4px' }}>pts</span>
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ fontSize: '11px', color: theme.progressText, fontWeight: 500 }}>{progress.label}</span>
              <span style={{ fontSize: '11px', color: theme.progressText, fontWeight: 700 }}>{progress.pct}%</span>
            </div>
            <div style={{ background: theme.progressBarBg, borderRadius: '10px', height: '5px', overflow: 'hidden' }}>
              <div style={{ background: theme.progressBarFill, borderRadius: '10px', height: '5px', width: `${progress.pct}%` }} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

