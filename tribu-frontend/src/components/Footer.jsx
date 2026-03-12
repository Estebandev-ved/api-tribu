import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    Flame, MapPin, Instagram, Mail, Phone,
    CheckCircle, Truck, Zap, RotateCcw, HeadphonesIcon, Heart,
} from 'lucide-react'

const GARANTIAS = [
    { Icon: CheckCircle, text: 'Pago 100% seguro' },
    { Icon: Truck, text: 'Envío a todo Colombia' },
    { Icon: Zap, text: 'Confirmación inmediata' },
    { Icon: RotateCcw, text: 'Cambios y devoluciones' },
    { Icon: HeadphonesIcon, text: 'Soporte por WhatsApp' },
]

export default function Footer() {
    return (
        <footer style={{
            background: '#0d0d0d',
            borderTop: '1px solid rgba(255,87,34,0.12)',
            padding: '4rem 0 2rem',
            marginTop: '4rem',
        }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>

                    {/* Columna 1: Marca */}
                    <div>
                        <motion.div whileHover={{ scale: 1.03 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ background: 'var(--color-primary)', borderRadius: '10px', padding: '7px', display: 'flex', boxShadow: '0 0 12px rgba(255,87,34,0.5)' }}>
                                <Flame size={17} color="#fff" />
                            </div>
                            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.3rem' }}>Tribu</span>
                        </motion.div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                            La comunidad que descubre los productos virales antes que nadie. Desde Mocoa para toda Colombia.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {/* Instagram */}
                            <motion.a href="#" target="_blank" rel="noopener noreferrer"
                                whileHover={{ scale: 1.15, color: '#e1306c' }}
                                style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', transition: 'color 0.2s' }}>
                                <Instagram size={18} />
                            </motion.a>
                            {/* TikTok — SVG inline ya que lucide no lo incluye */}
                            <motion.a href="#" target="_blank" rel="noopener noreferrer"
                                whileHover={{ scale: 1.15 }}
                                title="TikTok"
                                style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', transition: 'color 0.2s' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                                </svg>
                            </motion.a>
                        </div>
                    </div>

                    {/* Columna 2: Links */}
                    <div>
                        <h4 style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Explorar</h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {[
                                { to: '/', label: 'Tienda completa' },
                                { to: '/virales', label: 'Productos virales' },
                                { to: '/quienes-somos', label: 'Quiénes somos' },
                                { to: '/devoluciones', label: 'Devoluciones y envíos' },
                                { to: '/politicas', label: 'Términos y privacidad' },
                            ].map(link => (
                                <li key={link.to}>
                                    <Link to={link.to}
                                        style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}
                                        onMouseEnter={e => e.target.style.color = 'var(--color-primary)'}
                                        onMouseLeave={e => e.target.style.color = 'var(--color-text-muted)'}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Columna 3: Contacto */}
                    <div>
                        <h4 style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contacto</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: 'var(--color-text-muted)', fontSize: '0.87rem' }}>
                                <MapPin size={16} style={{ marginTop: 2, color: 'var(--color-primary)', flexShrink: 0 }} />
                                <span>Medellín, Antioquia<br />Colombia</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-text-muted)', fontSize: '0.87rem' }}>
                                <Mail size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                                <a href="mailto:contacto@tribu.com"
                                    style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                                    onMouseEnter={e => e.target.style.color = 'var(--color-primary)'}
                                    onMouseLeave={e => e.target.style.color = 'var(--color-text-muted)'}>
                                    contacto@tribu.com
                                </a>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-text-muted)', fontSize: '0.87rem' }}>
                                <Phone size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                                <span>WhatsApp: +57 300 000 0000</span>
                            </div>
                        </div>
                    </div>

                    {/* Columna 4: Garantías */}
                    <div>
                        <h4 style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Garantías</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {GARANTIAS.map(({ Icon, text }) => (
                                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-text-muted)', fontSize: '0.87rem' }}>
                                    <Icon size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Línea inferior */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <p style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>
                        © 2025 Tribu E-commerce · Medellín, Antioquia · Todos los derechos reservados
                    </p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>
                        Hecho con <Heart size={13} color="var(--color-primary)" fill="var(--color-primary)" /> para la comunidad
                    </p>
                </div>
            </div>
        </footer>
    )
}
