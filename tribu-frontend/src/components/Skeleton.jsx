import { motion } from 'framer-motion'

export default function Skeleton({ w = '100%', h = 20, r = 8 }) {
  return (
    <motion.div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: 'var(--color-background-secondary, #2a2a2a)'
      }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--color-background-primary, #1a1a1a)',
      border: '0.5px solid var(--color-border-tertiary, #333)',
      borderRadius: 16,
      padding: '1.25rem'
    }}>
      <Skeleton h={120} r={12} />
      <div style={{ marginTop: 12 }}>
        <Skeleton w="70%" h={16} />
        <Skeleton w="40%" h={12} style={{ marginTop: 8 }} />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton w={48} h={48} r={24} />
          <div style={{ flex: 1 }}>
            <Skeleton w="60%" h={14} />
            <Skeleton w="30%" h={10} style={{ marginTop: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )
}
