import { motion } from 'framer-motion'

export default function EmptyState({ 
  icon: Icon, 
  titulo = 'Sin datos', 
  descripcion = 'No hay información para mostrar',
  actionLabel,
  onAction 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: 'var(--color-background-primary, #1a1a1a)',
        border: '0.5px solid var(--color-border-tertiary, #333)',
        borderRadius: 16,
      }}
    >
      {Icon && (
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--color-background-secondary, #2a2a2a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <Icon size={36} style={{ opacity: 0.4 }} />
        </div>
      )}
      <h3 style={{
        fontSize: '1.1rem',
        fontWeight: 600,
        color: 'var(--color-text-primary, #fff)',
        marginBottom: '0.5rem'
      }}>
        {titulo}
      </h3>
      <p style={{
        fontSize: '0.9rem',
        color: 'var(--color-text-secondary, #888)',
        maxWidth: 280,
        lineHeight: 1.5
      }}>
        {descripcion}
      </p>
      {actionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            background: 'var(--color-primary, #ff5722)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  )
}
