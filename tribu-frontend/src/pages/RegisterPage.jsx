import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register } from '../api'
import toast from 'react-hot-toast'
import { Flame, MapPin } from 'lucide-react'

// Ciudades principales de Colombia (ordenadas por tamaño/relevancia)
const CIUDADES_COLOMBIA = [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
    'Bucaramanga', 'Cúcuta', 'Pereira', 'Manizales', 'Ibagué',
    'Santa Marta', 'Villavicencio', 'Pasto', 'Montería', 'Valledupar',
    'Neiva', 'Armenia', 'Popayán', 'Sincelejo', 'Riohacha',
    'Mocoa', 'Florencia', 'Tunja', 'Leticia', 'Quibdó',
    'Mitú', 'Puerto Carreño', 'San José del Guaviare', 'Inírida', 'Yopal',
    'Otra ciudad'
]

export default function RegisterPage() {
    const [form, setForm] = useState({
        nombreCompleto: '', email: '', password: '',
        telefono: '', ciudad: '', pais: 'Colombia', codigoPromocional: ''
    })
    const [loading, setLoading] = useState(false)
    const { loginUser } = useAuth()
    const navigate = useNavigate()

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.ciudad) { toast.error('Por favor selecciona tu ciudad'); return }
        setLoading(true)
        try {
            // Enviamos ciudad como "Ciudad, País" si es de otro país
            const ciudadFinal = form.pais === 'Colombia'
                ? form.ciudad
                : `${form.ciudad}, ${form.pais}`

            const { data } = await register({ ...form, ciudad: ciudadFinal })
            loginUser(data)
            toast.success(`¡Bienvenido a la Tribu, ${data.nombreCompleto.split(' ')[0]}! 🎉`)
            navigate('/')
        } catch (err) {
            toast.error(err.response?.data?.mensaje || 'Error al registrarse')
        } finally {
            setLoading(false)
        }
    }

    const esColombia = form.pais === 'Colombia'

    return (
        <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ width: '100%', maxWidth: 460 }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 64, height: 64, borderRadius: '18px',
                            background: 'var(--color-primary)', marginBottom: '1rem',
                            boxShadow: '0 0 24px var(--color-primary-glow)',
                        }}
                    >
                        <Flame size={30} color="#fff" />
                    </motion.div>
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.8rem' }}>Únete a la Tribu</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                        +10,000 miembros ya forman parte
                    </p>
                </div>

                <div className="card" style={{ padding: '2rem' }}>
                    <form onSubmit={handleSubmit}>

                        {/* Nombre */}
                        <div className="form-group">
                            <label>Nombre completo</label>
                            <input className="input" type="text" placeholder="Juan Pérez"
                                value={form.nombreCompleto} onChange={set('nombreCompleto')} required />
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label>Email</label>
                            <input className="input" type="email" placeholder="tu@email.com"
                                value={form.email} onChange={set('email')} required />
                        </div>

                        {/* Contraseña */}
                        <div className="form-group">
                            <label>Contraseña</label>
                            <input className="input" type="password" placeholder="Mínimo 6 caracteres"
                                value={form.password} onChange={set('password')} required minLength={6} />
                        </div>

                        {/* País */}
                        <div className="form-group">
                            <label><MapPin size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />País</label>
                            <select className="input" value={form.pais} onChange={set('pais')}>
                                <option value="Colombia">🇨🇴 Colombia</option>
                                <option value="Ecuador">🇪🇨 Ecuador</option>
                                <option value="Perú">🇵🇪 Perú</option>
                                <option value="Venezuela">🇻🇪 Venezuela</option>
                                <option value="México">🇲🇽 México</option>
                                <option value="Otro">🌎 Otro país</option>
                            </select>
                        </div>

                        {/* Ciudad — selector para Colombia, input libre para otros */}
                        <div className="form-group">
                            <label>Ciudad</label>
                            {esColombia ? (
                                <select className="input" value={form.ciudad}
                                    onChange={set('ciudad')} required>
                                    <option value="">Selecciona tu ciudad...</option>
                                    {CIUDADES_COLOMBIA.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            ) : (
                                <input className="input" type="text" placeholder="Tu ciudad"
                                    value={form.ciudad} onChange={set('ciudad')} required />
                            )}
                        </div>

                        {/* Teléfono (opcional) */}
                        <div className="form-group">
                            <label>Teléfono <span style={{ color: 'var(--color-text-faint)', fontWeight: 400 }}>(opcional)</span></label>
                            <input className="input" type="tel" placeholder="3100000000"
                                value={form.telefono} onChange={set('telefono')} />
                        </div>

                        {/* Código Promocional / Referido (opcional) */}
                        <div className="form-group" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(30,144,255,0.05)', border: '1px dashed rgba(30,144,255,0.3)', borderRadius: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1E90FF' }}>
                                <Flame size={14} /> Código de Invitación <span style={{ color: 'var(--color-text-faint)', fontWeight: 400 }}>(opcional)</span>
                            </label>
                            <input className="input" type="text" placeholder="Ej: TRIBU-A1B2C"
                                style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}
                                value={form.codigoPromocional} onChange={set('codigoPromocional')} />
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.4rem 0 0 0' }}>
                                Si un amigo te invitó, ingresa su código para recibir <strong>$5.000 COP</strong> de saldo de bienvenida.
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            type="submit" className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', fontWeight: 800, marginTop: '0.25rem' }}
                            disabled={loading}
                        >
                            {loading ? '⏳ Creando cuenta...' : '🔥 Unirme a la Tribu'}
                        </motion.button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Ingresar</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
