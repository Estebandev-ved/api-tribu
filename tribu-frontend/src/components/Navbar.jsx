import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Flame, ShoppingCart, LogOut, Menu, X, TrendingUp, WalletCards } from 'lucide-react'
import { useState } from 'react'
import CartDrawer from './CartDrawer'
import NotificacionDropdown from './NotificacionDropdown';

export default function Navbar() {
    const { user, logout, isAdmin, isAuthenticated } = useAuth()
    const { totalItems } = useCart()
    const navigate = useNavigate()
    const location = useLocation()
    const [cartOpen, setCartOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false) }
    const isActive = (path) => location.pathname === path

    const navLinks = [
        { to: '/', label: 'Tienda' },
        { to: '/virales', label: 'Virales', Icon: TrendingUp },
        ...(isAuthenticated ? [{ to: '/billetera', label: 'Tribu Card', Icon: WalletCards }] : []),
        ...(isAuthenticated ? [{ to: '/perfil', label: 'Mi Perfil' }] : []),
        ...(isAuthenticated && !isAdmin ? [{ to: '/mis-pedidos', label: 'Mis Pedidos' }] : []),
        ...(isAdmin ? [{ to: '/admin', label: 'Panel Admin' }] : []),
    ]

    return (
        <>
            <motion.nav
                initial={{ y: -64, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                style={{
                    position: 'sticky', top: 0, zIndex: 100,
                    background: 'rgba(13,13,13,0.97)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62, gap: '0.75rem' }}>
                    {/* ── Logo ── */}
                    <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }} onClick={() => setMenuOpen(false)}>
                        <motion.div whileHover={{ scale: 1.04 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ background: 'var(--color-primary)', borderRadius: '10px', padding: '7px', display: 'flex', boxShadow: '0 0 12px rgba(255,87,34,0.5)' }}>
                                <Flame size={17} color="#fff" />
                            </div>
                            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.25rem', color: '#fff', letterSpacing: '-0.02em' }}>Tribu</span>
                        </motion.div>
                    </Link>

                    {/* ── Links desktop ── */}
                    <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        {navLinks.map(link => (
                            <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
                                <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                                    style={{
                                        padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                                        fontSize: '0.87rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'color 0.2s',
                                        color: isActive(link.to) ? '#fff' : '#888',
                                        background: isActive(link.to) ? 'rgba(255,87,34,0.15)' : 'transparent',
                                        border: isActive(link.to) ? '1px solid rgba(255,87,34,0.3)' : '1px solid transparent',
                                    }}>
                                    {link.Icon && <link.Icon size={14} />}
                                    {link.label}
                                </motion.span>
                            </Link>
                        ))}
                    </div>

                    {/* ── Derecha ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
                        {/* Notificaciones (solo si está autenticado) */}
                        {isAuthenticated && <NotificacionDropdown />}

                        {/* Carrito (siempre visible) */}
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => setCartOpen(true)}
                            style={{
                                position: 'relative', background: 'rgba(255,87,34,0.12)',
                                border: '1px solid rgba(255,87,34,0.25)', borderRadius: '9999px',
                                padding: '0.5rem', cursor: 'pointer', color: 'var(--color-text)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <ShoppingCart size={20} />
                            <AnimatePresence>
                                {totalItems > 0 && (
                                    <motion.span key="badge"
                                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                        style={{
                                            position: 'absolute', top: -6, right: -6,
                                            background: 'var(--color-primary)', color: '#fff',
                                            borderRadius: '9999px', width: 20, height: 20,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.7rem', fontWeight: 800,
                                            boxShadow: '0 0 8px rgba(255,87,34,0.7)',
                                        }}>
                                        {totalItems > 9 ? '9+' : totalItems}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        {/* Auth — solo desktop */}
                        <div className="nav-auth-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {isAuthenticated ? (
                                <>
                                    <span style={{ fontSize: '0.85rem', color: '#777' }}>{user.nombreCompleto.split(' ')[0]}</span>
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        onClick={handleLogout} className="btn btn-ghost"
                                        style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                                        <LogOut size={14} /> Salir
                                    </motion.button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>Ingresar</Link>
                                    <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>Únete</Link>
                                </>
                            )}
                        </div>

                        {/* ── Hamburguesa (solo móvil) ── */}
                        <motion.button
                            className="nav-hamburger"
                            whileTap={{ scale: 0.88 }}
                            onClick={() => setMenuOpen(o => !o)}
                            aria-label="Menú"
                            style={{
                                display: 'none', background: 'none', border: 'none',
                                cursor: 'pointer', color: '#fff', padding: '0.4rem',
                            }}
                        >
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </motion.button>
                    </div>
                </div>
            </motion.nav>

            {/* ── Menú móvil desplegable ── */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.22 }}
                        style={{
                            position: 'fixed', top: 62, left: 0, right: 0,
                            background: 'rgba(13,13,13,0.99)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            borderBottom: '1px solid rgba(255,87,34,0.12)',
                            zIndex: 99, padding: '1.25rem 1.5rem 2rem',
                            display: 'flex', flexDirection: 'column', gap: '0.35rem',
                        }}
                    >
                        {navLinks.map((link, i) => (
                            <motion.div key={link.to}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                            >
                                <Link to={link.to}
                                    onClick={() => setMenuOpen(false)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        padding: '0.85rem 1rem', borderRadius: 12, textDecoration: 'none',
                                        color: isActive(link.to) ? '#fff' : '#aaa',
                                        background: isActive(link.to) ? 'rgba(255,87,34,0.12)' : 'transparent',
                                        fontWeight: 600, fontSize: '1rem',
                                    }}>
                                    {link.Icon && <link.Icon size={18} color={isActive(link.to) ? 'var(--color-primary)' : '#666'} />}
                                    {link.label}
                                </Link>
                            </motion.div>
                        ))}

                        {/* Auth en menú móvil */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '0.75rem', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {isAuthenticated ? (
                                <>
                                    <p style={{ color: '#666', fontSize: '0.85rem', padding: '0 1rem' }}>
                                        Hola, <strong style={{ color: '#aaa' }}>{user.nombreCompleto.split(' ')[0]}</strong>
                                    </p>
                                    <button onClick={handleLogout} className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                                        <LogOut size={15} /> Cerrar sesión
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setMenuOpen(false)} className="btn btn-ghost" style={{ justifyContent: 'center' }}>Ingresar</Link>
                                    <Link to="/register" onClick={() => setMenuOpen(false)} className="btn btn-primary" style={{ justifyContent: 'center' }}>Únete a Tribu</Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    )
}
