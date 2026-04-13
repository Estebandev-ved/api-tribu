import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TIER_CONFIG = {
  BRONCE: { bg: '#cd7f32', text: '#fff', glow: '#cd7f3280', icon: '🥉' },
  PLATA:  { bg: '#c0c0c0', text: '#333', glow: '#c0c0c080', icon: '🥈' },
  ORO:    { bg: '#ffd700', text: '#333', glow: '#ffd70080', icon: '🥇' }
}

const SIZE_CONFIG = {
  sm: { padding: '4px 8px', fontSize: '0.65rem', iconSize: '0.7rem' },
  md: { padding: '6px 12px', fontSize: '0.75rem', iconSize: '0.8rem' },
  lg: { padding: '8px 16px', fontSize: '0.85rem', iconSize: '1rem' }
}

export default function TierBadge({ tier, size = 'md', animated = true }) {
  const [animating, setAnimating] = useState(false)
  const prevTier = useRef(tier)

  useEffect(() => {
    if (animated && prevTier.current !== tier) {
      setAnimating(true)
      const timeout = setTimeout(() => setAnimating(false), 400)
      return () => clearTimeout(timeout)
    }
    prevTier.current = tier
  }, [tier, animated])

  const config = TIER_CONFIG[tier] || TIER_CONFIG.BRONCE
  const sizeStyles = SIZE_CONFIG[size] || SIZE_CONFIG.md

  return (
    <motion.div
      animate={animating ? { scale: [1, 1.4, 1] } : { scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: sizeStyles.padding,
        borderRadius: '20px',
        background: config.bg,
        color: config.text,
        fontSize: sizeStyles.fontSize,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        boxShadow: animating 
          ? `0 0 20px ${config.glow}, 0 0 40px ${config.glow}` 
          : `0 0 10px ${config.glow}`,
        transition: 'box-shadow 0.3s',
      }}
    >
      <span style={{ fontSize: sizeStyles.iconSize }}>{config.icon}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={tier}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {tier}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  )
}
