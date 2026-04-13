import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import profileService from '../services/profileService'
import ProfileHeader from '../components/profile/ProfileHeader'
import ProfileMenu from '../components/profile/ProfileMenu'
import ProfileDatosSection from '../components/profile/ProfileDatosSection'
import ProfileSeguridadSection from '../components/profile/ProfileSeguridadSection'
import ProfileNotificacionesSection from '../components/profile/ProfileNotificacionesSection'
import ProfileTribuCardSection from '../components/profile/ProfileTribuCardSection'
import ProfilePedidosSection from '../components/profile/ProfilePedidosSection'
import ProfileDevolucionesSection from '../components/profile/ProfileDevolucionesSection'
import ProfileReferidosSection from '../components/profile/ProfileReferidosSection'
import ProfileLogrosSection from '../components/profile/ProfileLogrosSection'
import ProfileAyudaSection from '../components/profile/ProfileAyudaSection'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { 
  User, 
  ShieldCheck, 
  Bell, 
  CreditCard, 
  Package, 
  RotateCcw, 
  Users, 
  Trophy, 
  HelpCircle 
} from 'lucide-react'

const SECTIONS = {
  datos: { icon: User, label: 'Mis datos', Component: ProfileDatosSection },
  seguridad: { icon: ShieldCheck, label: 'Seguridad', Component: ProfileSeguridadSection },
  notificaciones: { icon: Bell, label: 'Notificaciones', Component: ProfileNotificacionesSection },
  tribuCard: { icon: CreditCard, label: 'Mi Tribu Card', Component: ProfileTribuCardSection },
  pedidos: { icon: Package, label: 'Mis pedidos', Component: ProfilePedidosSection, badge: null },
  devoluciones: { icon: RotateCcw, label: 'Devoluciones', Component: ProfileDevolucionesSection },
  referidos: { icon: Users, label: 'Referidos', Component: ProfileReferidosSection },
  logros: { icon: Trophy, label: 'Logros y racha', Component: ProfileLogrosSection },
  ayuda: { icon: HelpCircle, label: 'Ayuda', Component: ProfileAyudaSection },
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('datos')
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    profileService.getPerfil()
      .then(res => setPerfil(res.data))
      .catch(() => toast.error('Error al cargar el perfil'))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const updatePerfil = (newData) => {
    setPerfil({ ...perfil, ...newData })
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  const ActiveComponent = SECTIONS[activeSection]?.Component

  return (
    <div className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem', minHeight: '100vh' }}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4 }}
        style={{ maxWidth: 1200, margin: '0 auto' }}
      >
        <ProfileHeader perfil={perfil} onUpdatePerfil={updatePerfil} />

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', 
          gap: '2rem',
          marginTop: '2rem'
        }}>
          <ProfileMenu 
            sections={SECTIONS}
            activeSection={activeSection}
            onSelect={setActiveSection}
            onLogout={handleLogout}
            isMobile={isMobile}
            pedidosBadge={0}
          />

          <div style={{ minWidth: 0 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {ActiveComponent && (
                  <ActiveComponent 
                    perfil={perfil} 
                    onUpdatePerfil={updatePerfil}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}