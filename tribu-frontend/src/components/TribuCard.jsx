import { useRef, useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'

const TIER_GRADIENTS = {
  BRONCE: 'linear-gradient(135deg, #cd7f32 0%, #a0522d 50%, #8b4513 100%)',
  PLATA: 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 50%, #808080 100%)',
  ORO: 'linear-gradient(135deg, #ffd700 0%, #daa520 50%, #b8860b 100%)'
}

const TIER_LABELS = {
  1: 'BRONCE',
  2: 'PLATA',
  3: 'ORO'
}

export default function TribuCard({ saldo, animarSaldo, tierActual, onFlip }) {
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
  const gradient = TIER_GRADIENTS[tierName]

  const isDarkText = nivelVip >= 2

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

  const formatCurrency = (monto) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto ?? 0)

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onFlip}
      style={{ perspective: '1000px', cursor: onFlip ? 'pointer' : 'default' }}
    >
      <motion.div
        style={{
          width: '380px',
          height: '240px',
          borderRadius: '16px',
          background: gradient,
          position: 'relative',
          overflow: 'hidden',
          transformStyle: 'preserve-3d',
          rotateX: springRotateX,
          rotateY: springRotateY,
          willChange: 'transform',
          boxShadow: nivelVip === 3 
            ? '0 20px 50px rgba(237,143,3,0.4), inset 0 0 0 1px rgba(255,255,255,0.3)'
            : '0 20px 50px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
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
        <div style={{ position: 'absolute', bottom: '-20%', right: '-20%', width: '150%', height: '150%', background: nivelVip === 3 ? 'radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.4) 0%, transparent 50%)' : 'radial-gradient(circle at bottom right, rgba(255, 87, 34, 0.2) 0%, transparent 50%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: isDarkText ? '#222' : '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ 
              width: '45px', 
              height: '35px', 
              background: 'linear-gradient(135deg, #ffd700, #b8860b)', 
              borderRadius: '6px', 
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}>
              <div style={{ position: 'absolute', top: '50%', width: '100%', height: '1px', background: 'rgba(0,0,0,0.2)' }} />
              <div style={{ position: 'absolute', left: '50%', width: '1px', height: '100%', background: 'rgba(0,0,0,0.2)' }} />
              <div style={{ position: 'absolute', top: '25%', width: '100%', height: '1px', background: 'rgba(0,0,0,0.15)' }} />
              <div style={{ position: 'absolute', top: '75%', width: '100%', height: '1px', background: 'rgba(0,0,0,0.15)' }} />
            </div>

            <div style={{ 
              padding: '4px 10px', 
              borderRadius: '20px', 
              background: isDarkText ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              {tierName}
            </div>
          </div>

          <div style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'monospace', opacity: 0.9 }}>
            TRIBU •••• •••• •••• 1234
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, opacity: 0.8 }}>
              {tierActual?.nombre || 'USUARIO'}
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7, marginBottom: '2px' }}>
                Balance Actual
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, textShadow: isDarkText ? 'none' : '0 2px 10px rgba(0,0,0,0.5)' }}>
                {formatCurrency(saldoAnimado)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
