import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Calendar, FileText, Save, Check, AlertTriangle } from 'lucide-react'
import profileService from '../../services/profileService'
import toast from 'react-hot-toast'

const CIUDADES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 
  'Cúcuta', 'Bucaramanga', 'Pereira', 'Manizales', 'Ibagué'
]

export default function ProfileDatosSection({ perfil, onUpdatePerfil }) {
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
    ciudad: '',
    fechaNacimiento: '',
    documento: '',
    tipoDocumento: 'CC'
  })
  const [errors, setErrors] = useState({})
  const [emailVerificado, setEmailVerificado] = useState(true)
  const [verificandoEmail, setVerificandoEmail] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (perfil) {
      setFormData({
        nombreCompleto: perfil.nombreCompleto || '',
        email: perfil.email || '',
        telefono: perfil.telefono || '',
        ciudad: perfil.ciudad || '',
        fechaNacimiento: perfil.fechaNacimiento || '',
        documento: perfil.documento || '',
        tipoDocumento: perfil.tipoDocumento || 'CC'
      })
      setEmailVerificado(perfil.emailVerificado ?? true)
    }
  }, [perfil])

  const validarEmail = useCallback(async (email) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return false
    }
    if (email === perfil?.email) return true
    
    setVerificandoEmail(true)
    try {
      await profileService.verificarEmail(email)
      return false
    } catch (err) {
      return err.response?.status === 404
    } finally {
      setVerificandoEmail(false)
    }
  }, [perfil?.email])

  const handleChange = async (e) => {
    const { name, value } = e.target
    let newValue = value

    if (name === 'telefono') {
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length <= 10) {
        if (cleaned.length > 0) {
          let formatted = cleaned
          if (cleaned.length >= 4) {
            formatted = cleaned.slice(0, 3) + ' ' + cleaned.slice(3)
          }
          if (cleaned.length >= 7) {
            formatted = formatted.slice(0, 7) + ' ' + formatted.slice(7)
          }
          newValue = cleaned.startsWith('57') ? '+' + cleaned : formatted
        }
      } else {
        return
      }
    }

    if (name === 'documento') {
      newValue = value.replace(/\D/g, '')
    }

    if (name === 'nombreCompleto') {
      newValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
    }

    setFormData(prev => ({ ...prev, [name]: newValue }))

    if (name === 'nombreCompleto') {
      setErrors(prev => ({ 
        ...prev, 
        nombre: newValue.length >= 3 ? null : 'Mínimo 3 caracteres'
      }))
    }

    if (name === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)) {
        setErrors(prev => ({ ...prev, email: 'Email inválido' }))
      } else {
        const disponible = await validarEmail(newValue)
        setErrors(prev => ({ 
          ...prev, 
          email: disponible ? null : 'Este email ya está en uso'
        }))
      }
    }

    if (name === 'telefono') {
      const telefonoRegex = /^(\+57)?[3]\d{2}\s?\d{3}\s?\d{4}$/
      setErrors(prev => ({ 
        ...prev, 
        telefono: newValue === '' || telefonoRegex.test(newValue) ? null : 'Formato: 300 123 4567'
      }))
    }

    if (name === 'fechaNacimiento') {
      if (newValue) {
        const fecha = new Date(newValue)
        const hoy = new Date()
        const edad = Math.floor((hoy - fecha) / (365.25 * 24 * 60 * 60 * 1000))
        setErrors(prev => ({ 
          ...prev, 
          fechaNacimiento: edad >= 18 ? null : 'Debes ser mayor de 18 años'
        }))
      }
    }

    if (name === 'documento') {
      setErrors(prev => ({ 
        ...prev, 
        documento: newValue.length >= 6 && newValue.length <= 12 ? null : '6-12 dígitos'
      }))
    }
  }

  const handleGuardar = async () => {
    if (Object.values(errors).some(e => e)) {
      toast.error('Corrige los errores antes de guardar')
      return
    }

    setGuardando(true)
    try {
      const res = await profileService.updatePerfil(formData)
      onUpdatePerfil(res.data)
      setEditando(false)
      toast.success('Perfil actualizado correctamente')
      
      if (formData.email !== perfil?.email) {
        toast.success('Te enviamos un correo para verificar el nuevo email')
      }
    } catch (error) {
      toast.error('Error al actualizar el perfil')
    } finally {
      setGuardando(false)
    }
  }

  const handleReenviarVerificacion = () => {
    if (resendCooldown > 0) return
    
    profileService.reenviarVerificacion()
      .then(() => {
        toast.success('Email de verificación enviado')
        setResendCooldown(60)
        const interval = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      })
      .catch(() => toast.error('Error al reenviar verificación'))
  }

  const inputStyle = (hasError) => ({
    width: '100%',
    background: 'rgba(30,30,30,0.8)',
    border: `1px solid ${hasError ? '#ff4d4d' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '0.5rem',
    padding: '0.875rem 1rem',
    color: 'var(--color-text)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  })

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
    marginBottom: '0.5rem'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(20,20,20,0.6)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1rem',
        padding: '2rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
          👤 Mis datos
        </h3>
        {!editando && (
          <button
            onClick={() => setEditando(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            Editar perfil
          </button>
        )}
      </div>

      {!emailVerificado && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#856404' }}>
            <AlertTriangle size={18} />
            <span style={{ fontWeight: 500 }}>Verifica tu email para acceder a todas las funciones</span>
          </div>
          <button
            onClick={handleReenviarVerificacion}
            disabled={resendCooldown > 0}
            style={{
              background: '#856404',
              color: '#fff',
              border: 'none',
              borderRadius: '0.25rem',
              padding: '0.5rem 1rem',
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem'
            }}
          >
            {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar verificación'}
          </button>
        </motion.div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={labelStyle}><User size={14} /> Nombre completo</label>
          {editando ? (
            <div>
              <input
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleChange}
                style={inputStyle(errors.nombre)}
                placeholder="Tu nombre completo"
              />
              {errors.nombre && <span style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.nombre}</span>}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text)', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
              {perfil?.nombreCompleto || 'No especificado'}
            </p>
          )}
        </div>

        <div>
          <label style={labelStyle}><Mail size={14} /> Email</label>
          {editando ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ ...inputStyle(errors.email), flex: 1 }}
                  placeholder="tu@email.com"
                />
                {verificandoEmail && <div className="spinner" style={{ width: 16, height: 16 }} />}
              </div>
              {errors.email && <span style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.email}</span>}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <p style={{ color: 'var(--color-text)', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
                {perfil?.email || 'No especificado'}
              </p>
              {emailVerificado && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#00C896', fontSize: '0.75rem' }}>
                  <Check size={12} /> Email verificado
                </span>
              )}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}><Phone size={14} /> Teléfono</label>
          {editando ? (
            <div>
              <input
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                style={inputStyle(errors.telefono)}
                placeholder="300 123 4567"
              />
              {errors.telefono && <span style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.telefono}</span>}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text)', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
              {perfil?.telefono || 'No especificado'}
            </p>
          )}
        </div>

        <div>
          <label style={labelStyle}><MapPin size={14} /> Ciudad</label>
          {editando ? (
            <select
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              style={inputStyle(false)}
            >
              <option value="">Selecciona una ciudad</option>
              {CIUDADES.map(ciudad => (
                <option key={ciudad} value={ciudad}>{ciudad}</option>
              ))}
            </select>
          ) : (
            <p style={{ color: 'var(--color-text)', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
              {perfil?.ciudad || 'No especificada'}
            </p>
          )}
        </div>

        <div>
          <label style={labelStyle}><Calendar size={14} /> Fecha de nacimiento</label>
          {editando ? (
            <div>
              <input
                name="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={handleChange}
                style={inputStyle(errors.fechaNacimiento)}
              />
              {errors.fechaNacimiento && <span style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.fechaNacimiento}</span>}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text)', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
              {perfil?.fechaNacimiento ? new Date(perfil.fechaNacimiento).toLocaleDateString('es-CO') : 'No especificada'}
            </p>
          )}
        </div>

        <div>
          <label style={labelStyle}><FileText size={14} /> Documento de identidad</label>
          {editando ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                name="tipoDocumento"
                value={formData.tipoDocumento}
                onChange={handleChange}
                style={{ ...inputStyle(false), width: '100px' }}
              >
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="NIT">NIT</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
              <input
                name="documento"
                value={formData.documento}
                onChange={handleChange}
                style={{ ...inputStyle(errors.documento), flex: 1 }}
                placeholder="12345678"
              />
            </div>
          ) : (
            <p style={{ color: 'var(--color-text)', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
              {perfil?.tipoDocumento && perfil?.documento 
                ? `${perfil.tipoDocumento} · ${perfil.documento}` 
                : 'No especificado'}
            </p>
          )}
        </div>
      </div>

      {editando && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setEditando(false)}
            className="btn btn-ghost"
            style={{ fontSize: '0.9rem' }}
          >
            Cancelar
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGuardar}
            disabled={guardando}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
          >
            {guardando ? (
              <div className="spinner" style={{ width: 16, height: 16 }} />
            ) : (
              <>
                <Save size={16} /> Guardar cambios
              </>
            )}
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}