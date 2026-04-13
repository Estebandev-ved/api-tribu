import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TierBadge from './TierBadge'

const TIER_PORCENTAJES = {
  BRONCE: 3,
  PLATA: 5,
  ORO: 8
}

export default function GamifiedReceipt({ 
  pedido, 
  tierActual, 
  proximoTier, 
  comprasMesActual, 
  onCerrar 
}) {
  const [showConfetti, setShowConfetti] = useState(false)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  const tierNombre = tierActual?.nombre || 'BRONCE'
  const cashbackPct = TIER_PORCENTAJES[tierNombre] || 3

  useEffect(() => {
    if (showConfetti && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      const particles = []
      const colors = ['#cd7f32', '#ffd700', '#c0c0c0', '#FF5722', '#FF9800']

      for (let i = 0; i < 30; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10 - 5,
          size: Math.random() * 6 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1
        })
      }

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        particles.forEach(p => {
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.3
          p.life -= 0.02

          ctx.globalAlpha = p.life
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        })

        if (particles.some(p => p.life > 0)) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }

      animate()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [showConfetti])

  const handleCerrar = () => {
    setShowConfetti(true)
    setTimeout(() => {
      onCerrar()
    }, 500)
  }

  const formatCurrency = (monto) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto || 0)

  const progresPorcentaje = Math.min((comprasMesActual / 10) * 100, 100)

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
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9997,
      }}
      onClick={onCerrar}
    >
      <motion.div
        initial={{ y: '100vh', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100vh', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          width: '340px',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '20px',
          background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #1a1a1a 10px, #1a1a1a 20px)',
          transform: 'translateY(-50%)',
        }} />

        <div style={{ padding: '2rem', paddingTop: '2.5rem' }}>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ textAlign: 'center', marginBottom: '1.5rem' }}
          >
            <h2 style={{ color: '#00C896', fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
              ¡Compra completada!
            </h2>
          </motion.div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Detalle</div>
            {pedido?.detalles?.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', padding: '0.3rem 0' }}>
                <span>{item.cantidad}x {item.nombre}</span>
                <span>{formatCurrency(item.precio * item.cantidad)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 700, borderTop: '1px solid #333', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span>Total</span>
              <span>{formatCurrency(pedido?.total)}</span>
            </div>
          </div>

          <div style={{ 
            background: 'rgba(255,87,34,0.1)', 
            border: '1px solid rgba(255,87,34,0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: '#fff', fontWeight: 600 }}>TU CASHBACK</span>
              <span style={{ color: '#ffd700', fontWeight: 800, fontSize: '1.1rem' }}>+{cashbackPct}%</span>
            </div>
            <div style={{ color: '#888', fontSize: '0.85rem' }}>
              {tierNombre} · {formatCurrency(pedido?.cashbackMonto || 0)} pendiente
            </div>
          </div>

          {proximoTier && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>Progreso hacia {proximoTier.nombre}</span>
                <span style={{ color: '#fff', fontSize: '0.8rem' }}>{comprasMesActual}/10 compras</span>
              </div>
              <div style={{ height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progresPorcentaje}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #FF5722, #FF9800)' }}
                />
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.3rem', textAlign: 'center' }}>
                Te faltan {10 - comprasMesActual} compras para {proximoTier.nombre}
              </div>
            </div>
          )}

          <button
            onClick={handleCerrar}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(45deg, #FF5722, #FF9800)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '1rem'
            }}
            whileTap={{ scale: 0.95 }}
          >
            Cerrar
          </button>
        </div>

        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '20px',
          background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #1a1a1a 10px, #1a1a1a 20px)',
          transform: 'translateY(50%)',
        }} />

        <canvas 
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: showConfetti ? 1 : 0,
            transition: 'opacity 0.3s'
          }}
        />
      </motion.div>
    </motion.div>
  )
}
