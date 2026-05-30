import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { NotificationProvider } from './context/NotificationContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CountdownBanner from './components/CountdownBanner'
import StickyMobileCart from './components/StickyMobileCart'
import SocialProofToast from './components/SocialProofToast'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminPage from './pages/AdminPage'
import CheckoutPage from './pages/CheckoutPage'
import MiPerfilPage from './pages/MiPerfilPage'
import ProfilePage from './pages/ProfilePage'
import MisPedidosPage from './pages/MisPedidosPage'
import ProductoDetailPage from './pages/ProductoDetailPage'
import QuienesSomosPage from './pages/QuienesSomosPage'
import DevolucionesPage from './pages/DevolucionesPage'
import PoliticasPage from './pages/PoliticasPage'
import BilleteraPage from './pages/BilleteraPage'
import TransferirPage from './pages/TransferirPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ReferidoArbolPage from './pages/ReferidoArbolPage'
import GruposPage from './pages/GruposPage'
import RachaPage from './pages/RachaPage'
import CampanasPage from './pages/admin/CampanasPage'
import InventarioPage from './pages/admin/InventarioPage'
import TelegramConfigPage from './pages/admin/TelegramConfigPage'
import TribuPassPage from './pages/TribuPassPage'
import FacturasPage from './pages/FacturasPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import HelpWidget from './components/HelpWidget'
import CookieConsent from './components/CookieConsent'
import AdminSecurityPage from './pages/admin/AdminSecurityPage'
import RecompensasPage from './pages/RecompensasPage'

function AdminRoute({ children }) {
  const { isAdmin, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

const fade = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } }

const Page = ({ children }) => (
  <motion.div variants={fade} initial="hidden" animate="show">{children}</motion.div>
)

function AppContent() {
  return (
    <BrowserRouter>
      <CountdownBanner />
      <Navbar />
      <Routes>
        <Route path="/" element={<Page><HomePage /></Page>} />
        <Route path="/virales" element={<Page><HomePage viralMode /></Page>} />
        <Route path="/producto/:id" element={<Page><ProductoDetailPage /></Page>} />
        <Route path="/login" element={<Page><LoginPage /></Page>} />
        <Route path="/register" element={<Page><RegisterPage /></Page>} />
        <Route path="/forgot-password" element={<Page><ForgotPasswordPage /></Page>} />
        <Route path="/reset-password" element={<Page><ResetPasswordPage /></Page>} />
        <Route path="/checkout" element={<PrivateRoute><Page><CheckoutPage /></Page></PrivateRoute>} />
        <Route path="/perfil" element={<PrivateRoute><Page><ProfilePage /></Page></PrivateRoute>} />
        <Route path="/billetera" element={<PrivateRoute><Page><BilleteraPage /></Page></PrivateRoute>} />
        <Route path="/transferir" element={<PrivateRoute><Page><TransferirPage /></Page></PrivateRoute>} />
        <Route path="/leaderboard" element={<PrivateRoute><Page><LeaderboardPage /></Page></PrivateRoute>} />
        <Route path="/referidos" element={<PrivateRoute><Page><ReferidoArbolPage /></Page></PrivateRoute>} />
        <Route path="/recompensas" element={<PrivateRoute><Page><RecompensasPage /></Page></PrivateRoute>} />
        <Route path="/grupos" element={<PrivateRoute><Page><GruposPage /></Page></PrivateRoute>} />
        <Route path="/racha" element={<PrivateRoute><Page><RachaPage /></Page></PrivateRoute>} />
        <Route path="/tribu-pass" element={<PrivateRoute><Page><TribuPassPage /></Page></PrivateRoute>} />
        <Route path="/facturas" element={<PrivateRoute><Page><FacturasPage /></Page></PrivateRoute>} />
        <Route path="/mis-pedidos" element={<PrivateRoute><Page><MisPedidosPage /></Page></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><Page><AdminPage /></Page></AdminRoute>} />
        <Route path="/admin/seguridad" element={<AdminRoute><Page><AdminSecurityPage /></Page></AdminRoute>} />
        <Route path="/admin/campanas" element={<AdminRoute><Page><CampanasPage /></Page></AdminRoute>} />
        <Route path="/admin/inventario" element={<AdminRoute><Page><InventarioPage /></Page></AdminRoute>} />
        <Route path="/admin/telegram" element={<AdminRoute><Page><TelegramConfigPage /></Page></AdminRoute>} />
        <Route path="/quienes-somos" element={<Page><QuienesSomosPage /></Page>} />
        <Route path="/devoluciones" element={<Page><DevolucionesPage /></Page>} />
        <Route path="/politicas" element={<Page><PoliticasPage /></Page>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A1A', color: '#F5F5F5',
            border: '1px solid rgba(255,87,34,0.2)', borderRadius: '10px',
          },
          success: { iconTheme: { primary: '#00C896', secondary: '#fff' } },
          error: { iconTheme: { primary: '#FF3B3B', secondary: '#fff' } },
        }}
      />
      <SocialProofToast />
      <StickyMobileCart />
      <CookieConsent />
      <HelpWidget />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <AppContent />
          <Toaster position="bottom-right" reverseOrder={false} />
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  )
}
