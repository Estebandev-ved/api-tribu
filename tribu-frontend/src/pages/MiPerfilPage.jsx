import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, MapPin, Mail, Save, LogOut, Package, ShoppingBag, Gift } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMiPerfil, updateMiPerfil, getMisPedidos } from '../api'
import PedidoCard from '../components/PedidoCard'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function MiPerfilPage() {
    const { logout } = useAuth()
    const navigate = useNavigate()
    const [perfil, setPerfil] = useState({ nombreCompleto: '', email: '', telefono: '', direccion: '' })
    const [pedidos, setPedidos] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('datos')

    // Check if user can spin today
    const canSpinToday = () => {
        if (!perfil.fechaUltimoGiroRuleta) return true;
        const lastSpin = new Date(perfil.fechaUltimoGiroRuleta);
        const today = new Date();
        return lastSpin.toDateString() !== today.toDateString();
    }

    useEffect(() => {
        Promise.all([
            getMiPerfil(),
            getMisPedidos().catch(() => ({ data: [] }))
        ])
            .then(([resPerfil, resPedidos]) => {
                setPerfil(resPerfil.data)
                setPedidos(resPedidos.data)
            })
            .catch(() => toast.error('Error al cargar la información del perfil'))
            .finally(() => setLoading(false))
    }, [])

    const handleChange = e => setPerfil({ ...perfil, [e.target.name]: e.target.value })

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await updateMiPerfil({
                nombreCompleto: perfil.nombreCompleto,
                telefono: perfil.telefono,
                direccion: perfil.direccion
            })
            setPerfil({ ...perfil, ...res.data }) // Update local state
            toast.success('Perfil actualizado correctamente')
        } catch (error) {
            toast.error('Ocurrió un error al actualizar los datos')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}><div className="spinner" /></div>

    return (
        <div className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem', minHeight: '80vh' }}>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 800, margin: '0 auto' }}>

                {/* Cabecera del Dashboard */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255,87,34,0.15)', padding: '1rem', borderRadius: '50%', color: 'var(--color-primary)' }}>
                            <User size={32} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>¡Hola, {perfil.nombreCompleto.split(' ')[0]}!</h1>
                            <p style={{ color: 'var(--color-text-faint)', fontSize: '0.9rem', margin: 0 }}>Gestiona tu cuenta y sigue tus compras.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {canSpinToday() && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/billetera')}
                                style={{ background: 'linear-gradient(45deg, #FF5722, #FF9800)', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,87,34,0.4)', fontSize: '0.85rem' }}>
                                <Gift size={16} /> ¡Giro Gratis!
                            </motion.button>
                        )}
                        <button onClick={() => { logout(); navigate('/') }} className="btn btn-ghost" style={{ fontSize: '0.85rem', color: '#ff4d4d' }}>
                            <LogOut size={16} /> Cerrar Sesión
                        </button>
                    </div>
                </div>

                {/* Sistema de Pestañas */}
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('datos')}
                        style={{
                            background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer',
                            color: activeTab === 'datos' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderBottom: activeTab === 'datos' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            fontWeight: activeTab === 'datos' ? 700 : 500, fontSize: '1rem',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                        }}>
                        <User size={18} /> Datos Personales
                    </button>
                    <button
                        onClick={() => setActiveTab('pedidos')}
                        style={{
                            background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer',
                            color: activeTab === 'pedidos' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderBottom: activeTab === 'pedidos' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            fontWeight: activeTab === 'pedidos' ? 700 : 500, fontSize: '1rem',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                        }}>
                        <Package size={18} /> Mis Pedidos
                        {pedidos.length > 0 && (
                            <span style={{ background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{pedidos.length}</span>
                        )}
                    </button>
                </div>

                {/* Contenido de las Pestañas */}
                <AnimatePresence mode="wait">
                    {activeTab === 'datos' ? (
                        <motion.div key="datos" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                            <div style={{ background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                {/* Contenido movido a la pestaña Billetera */}

                                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                                    {/* Email — Lectura solamente */}
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#888', marginBottom: '0.4rem' }}>
                                            <Mail size={14} /> Correo Electrónico (No modificable)
                                        </label>
                                        <input className="input" type="email" value={perfil.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                                    </div>

                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.4rem' }}>
                                            <User size={14} /> Nombre Completo
                                        </label>
                                        <input className="input" type="text" name="nombreCompleto" value={perfil.nombreCompleto} onChange={handleChange} required placeholder="¿Cómo te llamas?" />
                                    </div>

                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.4rem' }}>
                                            <Phone size={14} /> Teléfono
                                        </label>
                                        <input className="input" type="text" name="telefono" value={perfil.telefono} onChange={handleChange} placeholder="Tu número de contacto (Para envíos)" />
                                    </div>

                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.4rem' }}>
                                            <MapPin size={14} /> Dirección de Envío Principal
                                        </label>
                                        <textarea className="input" name="direccion" value={perfil.direccion} onChange={handleChange} rows={3} placeholder="Calle, número, apto, barrio, ciudad..." style={{ resize: 'vertical' }} />
                                    </div>

                                    <motion.button
                                        type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.8rem', justifyContent: 'center' }}>
                                        {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><Save size={18} /> Guardar Cambios</>}
                                    </motion.button>
                                </form>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="pedidos" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                            {pedidos.length === 0 ? (
                                <div className="empty-state" style={{ padding: '4rem 1rem' }}>
                                    <ShoppingBag size={48} />
                                    <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Aún no tienes compras en Tribu</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)', marginTop: '0.5rem' }}>Explora nuestras tendencias virales y haz tu primer pedido.</p>
                                    <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/virales')}>
                                        Ver Lo Más Viral
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {pedidos.map((p, i) => <PedidoCard key={p.id} pedido={p} index={i} />)}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        </div>
    )
}
