import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { TIER_COLORS } from '../../utils/tierColors'

export default function ProfileMenu({ sections, activeSection, onSelect, onLogout, isMobile, pedidosBadge }) {
  const { user } = useAuth()
  const tierActual = user?.tier || 'BRONCE'
  const tierColor = TIER_COLORS[tierActual]?.primary || '#888'

  const menuItems = Object.entries(sections).map(([key, section]) => ({
    key,
    ...section
  }))

  if (isMobile) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        {menuItems.slice(0, 9).map((item) => (
          <motion.button
            key={item.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(item.key)}
            style={{
              background: activeSection === item.key ? `${tierColor}20` : 'rgba(20,20,20,0.6)',
              border: `1px solid ${activeSection === item.key ? tierColor : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '0.75rem',
              padding: '1rem 0.5rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ 
              marginBottom: '0.25rem',
              color: activeSection === item.key ? tierColor : 'var(--color-text-muted)'
            }}>
              <item.icon size={22} />
            </div>
            <span style={{
              fontSize: '0.7rem',
              color: activeSection === item.key ? tierColor : 'var(--color-text-muted)',
              fontWeight: activeSection === item.key ? 600 : 400,
              textAlign: 'center'
            }}>
              {item.label}
            </span>
            {item.badge > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                background: 'var(--color-primary)', color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {item.badge}
              </span>
            )}
          </motion.button>
        ))}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          style={{
            background: 'rgba(20,20,20,0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '0.75rem',
            padding: '1rem 0.5rem',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <LogOut size={22} color="var(--color-text-muted)" style={{ marginBottom: '0.25rem' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Cerrar sesión
          </span>
        </motion.button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        background: 'rgba(20,20,20,0.6)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1rem',
        padding: '1rem',
        position: 'sticky',
        top: '6rem',
        height: 'fit-content'
      }}
    >
      {menuItems.map((item) => (
        <motion.button
          key={item.key}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(item.key)}
          style={{
            width: '100%',
            background: activeSection === item.key ? `${tierColor}15` : 'transparent',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.875rem 1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.25rem',
            transition: 'all 0.2s'
          }}
        >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: activeSection === item.key ? `${tierColor}20` : 'rgba(255,255,255,0.03)',
              color: activeSection === item.key ? tierColor : 'var(--color-text-muted)'
            }}>
              <item.icon size={18} />
            </div>
            <span style={{
              color: activeSection === item.key ? tierColor : 'var(--color-text)',
              fontWeight: activeSection === item.key ? 600 : 400,
              fontSize: '0.9rem'
            }}>
              {item.label}
            </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {item.badge > 0 && (
              <span style={{
                background: 'var(--color-primary)', color: '#fff',
                borderRadius: '50%', minWidth: 20, height: 20,
                fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {item.badge}
              </span>
            )}
            <span style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>→</span>
          </div>
        </motion.button>
      ))}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0.5rem 0' }} />

      <motion.button
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onLogout}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.875rem 1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#ff4d4d'
        }}
      >
        <LogOut size={18} />
        <span style={{ fontSize: '0.9rem' }}>Cerrar sesión</span>
      </motion.button>
    </motion.div>
  )
}