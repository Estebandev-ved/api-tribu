import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
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
import MisPedidosPage from './pages/MisPedidosPage'
import ProductoDetailPage from './pages/ProductoDetailPage'
import QuienesSomosPage from './pages/QuienesSomosPage'
import DevolucionesPage from './pages/DevolucionesPage'
import PoliticasPage from './pages/PoliticasPage'
import BilleteraPage from './pages/BilleteraPage'
import { NotificationProvider } from './context/NotificationContext';

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
        <Route path="/checkout" element={<PrivateRoute><Page><CheckoutPage /></Page></PrivateRoute>} />
        <Route path="/perfil" element={<PrivateRoute><Page><MiPerfilPage /></Page></PrivateRoute>} />
        <Route path="/billetera" element={<PrivateRoute><Page><BilleteraPage /></Page></PrivateRoute>} />
        <Route path="/mis-pedidos" element={<PrivateRoute><Page><MisPedidosPage /></Page></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><Page><AdminPage /></Page></AdminRoute>} />
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
