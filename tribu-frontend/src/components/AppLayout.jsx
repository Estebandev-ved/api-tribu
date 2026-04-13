import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Wallet, ShoppingBag, Users, User, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { getTierColor, getTierFromOrden } from '../utils/tierColors'

const TABS = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/billetera', label: 'Billetera', icon: Wallet },
  { path: '/tienda', label: 'Tienda', icon: ShoppingBag },
  { path: '/grupos', label: 'Social', icon: Users },
  { path: '/perfil', label: 'Perfil', icon: User }
]

export default function AppLayout({ children }) {
  const location = useLocation()
  const { user } = useAuth()
  const { noLeidas } = useNotification()
  const [showMobileNav, setShowMobileNav] = useState(false)
  
  const tierColor = getTierColor(getTierFromOrden(user?.nivelVip || 1))
  const currentTab = TABS.find(t => t.path === location.pathname)?.path || '/'
  
  useEffect(() => {
    const checkMobile = () => {
      setShowMobileNav(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!showMobileNav) {
    return <>{children}</>
  }

  return (
    <div style={{ 
      maxWidth: 480, 
      margin: '0 auto', 
      minHeight: '100vh',
      paddingBottom: 80,
      background: 'var(--color-background, #0a0a0a)'
    }}>
      {children}
      
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 480,
          margin: '0 auto',
          background: 'var(--color-background-primary, #1a1a1a)',
          borderTop: '0.5px solid var(--color-border-tertiary, #333)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '0.5rem 0',
          zIndex: 50
        }}
      >
        {TABS.map((tab) => {
          const isActive = currentTab === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path))
          const Icon = tab.icon
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              style={{ textDecoration: 'none', position: 'relative' }}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  color: isActive ? tierColor.primary : '#666',
                  transition: 'color 0.2s'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {tab.path === '/grupos' && (
                    <span style={{
                      position: 'absolute',
                      top: -4,
                      right: -6,
                      width: 8,
                      height: 8,
                      background: '#E24B4A',
                      borderRadius: '50%'
                    }} />
                  )}
                  {tab.path === '/perfil' && noLeidas > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: -4,
                      right: -6,
                      minWidth: 16,
                      height: 16,
                      background: '#E24B4A',
                      borderRadius: 8,
                      fontSize: '0.65rem',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px'
                    }}>
                      {noLeidas > 9 ? '9+' : noLeidas}
                    </span>
                  )}
                </div>
                <span style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: isActive ? 600 : 400,
                  marginTop: 2
                }}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    style={{
                      position: 'absolute',
                      bottom: -8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 20,
                      height: 3,
                      background: tierColor.primary,
                      borderRadius: 2
                    }}
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </motion.nav>
    </div>
  )
}
