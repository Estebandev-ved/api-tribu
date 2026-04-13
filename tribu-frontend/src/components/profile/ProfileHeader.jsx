import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { TIER_COLORS } from '../../utils/tierColors'
import profileService from '../../services/profileService'
import toast from 'react-hot-toast'

export default function ProfileHeader({ perfil, onUpdatePerfil }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [uploading, setUploading] = useState(false)

  const nombreCompleto = perfil?.nombreCompleto || user?.nombreCompleto || 'Usuario'
  const iniciales = nombreCompleto.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const tierActual = perfil?.tier || user?.tier || 'BRONCE'
  const color = TIER_COLORS[tierActual]?.primary || '#888'

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen válida')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB')
      return
    }

    setPreviewImage(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!previewImage) return
    
    setUploading(true)
    try {
      const file = fileInputRef.current?.files?.[0]
      if (!file) return

      const res = await profileService.uploadFotoPerfil(file)
      onUpdatePerfil({ fotoPerfil: res.data.fotoPerfil })
      toast.success('Foto de perfil actualizada')
      setPreviewImage(null)
    } catch (error) {
      toast.error('Error al subir la foto')
    } finally {
      setUploading(false)
    }
  }

  const tieneFoto = perfil?.fotoPerfil || user?.fotoPerfil

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(20,20,20,0.6)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1rem',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ position: 'relative' }}>
        {tieneFoto && !previewImage ? (
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              backgroundImage: `url(${perfil?.fotoPerfil || user?.fotoPerfil})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer',
              border: `3px solid ${color}40`
            }}
            onClick={() => fileInputRef.current?.click()}
          />
        ) : (
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: previewImage ? `url(${previewImage}) center/cover` : color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 72 * 0.35, fontWeight: 600, color: '#fff',
              cursor: 'pointer', border: `3px solid ${color}40`
            }}
            onClick={() => !previewImage && fileInputRef.current?.click()}
          >
            {previewImage ? null : iniciales}
          </motion.div>
        )}
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            position: 'absolute', bottom: 0, right: 0,
            background: 'var(--color-primary)', border: 'none',
            borderRadius: '50%', padding: '8px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Camera size={14} color="#fff" />
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
            {nombreCompleto}
          </h2>
          <span style={{
            background: `${color}20`, color: color,
            padding: '4px 12px', borderRadius: '20px',
            fontSize: '0.75rem', fontWeight: 600
          }}>
            {tierActual}
          </span>
        </div>
        <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
          {perfil?.email || user?.email}
        </p>
        <p style={{ color: 'var(--color-text-faint)', margin: '8px 0 0', fontSize: '0.8rem' }}>
          Miembro desde: {perfil?.fechaRegistro ? new Date(perfil.fechaRegistro).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }) : 'Mes 2024'}
          {perfil?.rachaActual > 0 && ` · Racha: 🔥 ${perfil.rachaActual} días`}
        </p>
      </div>

      {previewImage && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setPreviewImage(null)}
            className="btn btn-ghost"
            style={{ fontSize: '0.85rem' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            {uploading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : 'Confirmar'}
          </button>
        </div>
      )}
    </motion.div>
  )
}