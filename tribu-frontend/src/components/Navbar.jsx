import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, LogOut, Menu, X, TrendingUp, WalletCards, Trophy, Users, ChevronDown, User, Gem, FileText, Sun, Moon, Gift } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import CartDrawer from './CartDrawer'
import NotificacionDropdown from './NotificacionDropdown';

function DropdownMenu({ label, Icon, links, isActive }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.87rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s',
                    color: isActive ? '#fff' : '#888',
                    background: isActive ? 'rgba(255,87,34,0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(255,87,34,0.3)' : '1px solid transparent',
                    cursor: 'pointer'
                }}
            >
                {Icon && <Icon size={14} />}
                {label}
                <ChevronDown size={12} style={{
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    opacity: 0.6
                }} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute',
                            top: '120%',
                            left: 0,
                            minWidth: '200px',
                            background: 'rgba(20, 20, 20, 0.98)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            padding: '0.5rem',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            zIndex: 1000
                        }}
                    >
                        {links.map((link, i) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setIsOpen(false)}
                                style={{ textDecoration: 'none' }}
                            >
                                <motion.div
                                    whileHover={{ background: 'rgba(255, 255, 255, 0.03)', x: 4 }}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        color: '#ccc',
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {link.Icon && <link.Icon size={16} color="var(--color-primary)" />}
                                    {link.label}
                                </motion.div>
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Navbar() {
    const { user, logout, isAdmin, isAuthenticated } = useAuth()
    const { totalItems } = useCart()
    const navigate = useNavigate()
    const location = useLocation()
    const [cartOpen, setCartOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false) }
    const isActive = (path) => location.pathname === path

    const communityLinks = [
        { to: '/leaderboard', label: 'Ranking', Icon: Trophy },
        { to: '/referidos', label: 'Referidos', Icon: Users },
        { to: '/recompensas', label: 'Recompensas', Icon: Gift },
        { to: '/grupos', label: 'Grupos', Icon: Users },
    ]

    const userLinks = [
        { to: '/perfil', label: 'Mi Perfil', Icon: User },
        { to: '/mis-pedidos', label: 'Mis Pedidos', Icon: ShoppingCart },
        { to: '/facturas', label: 'Mis Facturas', Icon: FileText },
    ]

    const isCommunityActive = communityLinks.some(link => isActive(link.to))

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
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72, gap: '0.75rem' }}>
                    {/* ── Logo ── */}
                    <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }} onClick={() => setMenuOpen(false)}>
                        <motion.div whileHover={{ scale: 1.04 }} style={{ display: 'flex', alignItems: 'center' }}>
                            <img
                                src="/logo-tribu.svg"
                                alt="Tribu"
                                style={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: 10,
                                    objectFit: 'contain',
                                    background: 'transparent',
                                    padding: 0,
                                    display: 'block'
                                }}
                            />
                        </motion.div>
                    </Link>

                    {/* ── Links desktop ── */}
                    <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link to="/" style={{ textDecoration: 'none' }}>
                            <motion.span whileHover={{ scale: 1.05 }}
                                style={{
                                    padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                                    fontSize: '0.87rem', fontWeight: 600, color: isActive('/') ? '#fff' : '#888',
                                    background: isActive('/') ? 'rgba(255,87,34,0.15)' : 'transparent',
                                }}>
                                Tienda
                            </motion.span>
                        </Link>

                        <Link to="/virales" style={{ textDecoration: 'none' }}>
                            <motion.span whileHover={{ scale: 1.05 }}
                                style={{
                                    padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                                    fontSize: '0.87rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem',
                                    color: isActive('/virales') ? '#fff' : '#888',
                                    background: isActive('/virales') ? 'rgba(255,87,34,0.15)' : 'transparent',
                                }}>
                                <TrendingUp size={14} />
                                Virales
                            </motion.span>
                        </Link>

                        {isAuthenticated && (
                            <>
                                <Link to="/billetera" style={{ textDecoration: 'none' }}>
                                    <motion.span whileHover={{ scale: 1.05 }}
                                        style={{
                                            padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                                            fontSize: '0.87rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem',
                                            color: isActive('/billetera') ? '#fff' : '#888',
                                            background: isActive('/billetera') ? 'rgba(255,87,34,0.15)' : 'transparent',
                                        }}>
                                        <WalletCards size={14} />
                                        TribuCard
                                    </motion.span>
                                </Link>

                                <Link to="/tribu-pass" style={{ textDecoration: 'none' }}>
                                    <motion.span whileHover={{ scale: 1.05 }}
                                        style={{
                                            padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                                            fontSize: '0.87rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem',
                                            whiteSpace: 'nowrap',
                                            color: isActive('/tribu-pass') ? '#fbbf24' : '#888',
                                            background: isActive('/tribu-pass') ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                            border: isActive('/tribu-pass') ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                                        }}>
                                        <Gem size={14} />
                                        Tribu Pass
                                    </motion.span>
                                </Link>

                                <DropdownMenu
                                    label="Comunidad"
                                    Icon={Users}
                                    links={communityLinks}
                                    isActive={isCommunityActive}
                                />
                            </>
                        )}

                        {isAdmin && (
                            <Link to="/admin" style={{ textDecoration: 'none' }}>
                                <motion.span whileHover={{ scale: 1.05 }}
                                    style={{
                                        padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                                        fontSize: '0.87rem', fontWeight: 600, color: isActive('/admin') ? '#fff' : '#888',
                                        whiteSpace: 'nowrap',
                                        background: isActive('/admin') ? 'rgba(255,255,255,0.05)' : 'transparent',
                                    }}>
                                    Panel Admin
                                </motion.span>
                            </Link>
                        )}
                    </div>

                    {/* ── Derecha ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleTheme}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '9999px',
                                padding: '0.5rem',
                                cursor: 'pointer',
                                color: 'var(--color-text)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
                        >
                            {theme === 'dark' ? <Sun size={20} color="#FFB84D" /> : <Moon size={20} color="#FF5722" />}
                        </motion.button>

                        {isAuthenticated && <NotificacionDropdown />}

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
                        <div className="nav-auth-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {isAuthenticated ? (
                                <DropdownMenu
                                    label={user.nombreCompleto.split(' ')[0]}
                                    Icon={User}
                                    links={[...userLinks, { to: '#', label: 'Cerrar Sesión', Icon: LogOut, onClick: handleLogout }]}
                                    isActive={isActive('/perfil') || isActive('/mis-pedidos')}
                                />
                            ) : (
                                <>
                                    <Link to="/login" className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>Ingresar</Link>
                                    <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>Únete</Link>
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

            {/* ── Menú móvil ── */}
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
                        {/* Adaptar links para móvil (sin dropdowns) */}
                        {[
                            { to: '/', label: 'Tienda' },
                            { to: '/virales', label: 'Virales', Icon: TrendingUp },
                            ...(isAuthenticated ? [
                                { to: '/billetera', label: 'Tribu Card', Icon: WalletCards },
                                { to: '/tribu-pass', label: 'Tribu Pass', Icon: Gem },
                                ...communityLinks,
                                ...userLinks
                            ] : []),
                            ...(isAdmin ? [{ to: '/admin', label: 'Panel Admin' }] : []),
                        ].map((link, i) => (
                            <motion.div key={link.to}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
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

                        {isAuthenticated && (
                            <button onClick={handleLogout} className="btn btn-ghost" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                                <LogOut size={15} /> Cerrar sesión
                            </button>
                        )}

                        {!isAuthenticated && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}
                            >
                                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn btn-ghost" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    Ingresar
                                </Link>
                                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', padding: '0.75rem', borderRadius: '12px', background: 'var(--color-primary)', color: '#fff', fontWeight: 'bold' }}>
                                    Únete a la Tribu
                                </Link>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    )
}
