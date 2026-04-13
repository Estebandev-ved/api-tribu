import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TIER_CONFIG = {
  BRONCE: { 
    bg: 'linear-gradient(135deg, #cd7f32 0%, #a0522d 50%, #8b4513 100%)',
    icon: '🥉',
    label: 'BRONCE'
  },
  PLATA:  { 
    bg: 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 50%, #808080 100%)',
    icon: '🥈',
    label: 'PLATA'
  },
  ORO:    { 
    bg: 'linear-gradient(135deg, #ffd700 0%, #daa520 50%, #b8860b 100%)',
    icon: '🥇',
    label: 'ORO'
  }
}

export default function TierUpToast({ mensaje, tier, onCerrar }) {
  const [progress, setProgress] = useState(100)
  const timeoutRef = useRef(null)
  const config = TIER_CONFIG[tier] || TIER_CONFIG.ORO

  useEffect(() => {
    const duration = 4000
    const interval = 50
    const decrement = (interval / duration) * 100

    timeoutRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(timeoutRef.current)
          onCerrar?.()
          return 0
        }
        return prev - decrement
      })
    }, interval)

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current)
      }
    }
  }, [onCerrar])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          width: '340px',
          maxWidth: '90vw',
        }}
      >
        <div style={{
          background: config.bg,
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <button
            onClick={onCerrar}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              background: 'rgba(0,0,0,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
            }}
          >
            ×
          </button>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            color: tier === 'PLATA' ? '#333' : '#fff',
          }}>
            <span style={{ fontSize: '3rem' }}>{config.icon}</span>
            <div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.5rem', 
                fontWeight: 900,
                textShadow: tier === 'PLATA' ? 'none' : '0 2px 10px rgba(0,0,0,0.3)'
              }}>
                ¡Subiste a {config.label}!
              </h3>
              <p style={{ 
                margin: '0.3rem 0 0 0', 
                fontSize: '0.9rem',
                opacity: 0.9 
              }}>
                {mensaje}
              </p>
            </div>
          </div>

          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <motion.div
              style={{
                height: '100%',
                background: tier === 'PLATA' ? '#333' : '#fff',
                transformOrigin: 'left',
              }}
              animate={{ scaleX: progress / 100 }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
