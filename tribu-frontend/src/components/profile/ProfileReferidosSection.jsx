import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Copy, Share2, ArrowRight, Gift } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfileReferidosSection({ perfil }) {
  const [estadisticas, setEstadisticas] = useState({
    totalInvitados: 0,
    activosEsteMes: 0,
    totalGanado: 0
  })
  const [loading, setLoading] = useState(true)

  const codigoReferido = perfil?.codigoReferido || 'TRIBU-XXXX'

  useEffect(() => {
    Promise.all([
      fetch('/api/referidos/estadisticas').then(r => r.json()).catch(() => ({}))
    ])
      .then(([res]) => setEstadisticas(res))
      .finally(() => setLoading(false))
  }, [])

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoReferido)
    toast.success('Código copiado al portapapeles')
  }

  const compartirWhatsApp = () => {
    const texto = encodeURIComponent(
      `¡Únete a Tribu Card con mi código ${codigoReferido} y gana $5.000 de bienvenida! 🎁\n\n` +
      `${window.location.origin}/registro?ref=${codigoReferido}`
    )
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  const compartirInstagram = () => {
    const texto = `Usa mi código ${codigoReferido} en Tribu Card y gana $5.000 💰\n\n${window.location.origin}/registro?ref=${codigoReferido}`
    navigator.clipboard.writeText(texto)
    toast.success('Texto copiado para Instagram')
  }

  const compartirEnlace = () => {
    navigator.clipboard.writeText(`${window.location.origin}/registro?ref=${codigoReferido}`)
    toast.success('Enlace copiado')
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
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        👥 Mi programa de referidos
      </h3>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
          Tu código
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{
            flex: 1,
            background: 'rgba(30,30,30,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem',
            padding: '0.875rem 1rem',
            color: 'var(--color-primary)',
            fontWeight: 600,
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            letterSpacing: '0.05em'
          }}>
            {codigoReferido}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copiarCodigo}
            style={{
              background: 'var(--color-primary)',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#fff'
            }}
          >
            <Copy size={18} />
          </motion.button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={compartirWhatsApp}
          style={{
            background: '#25D366',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            color: '#fff',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flex: 1,
            justifyContent: 'center',
            minWidth: 120
          }}
        >
          WhatsApp
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={compartirInstagram}
          style={{
            background: '#E4405F',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            color: '#fff',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flex: 1,
            justifyContent: 'center',
            minWidth: 120
          }}
        >
          Instagram
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={compartirEnlace}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            color: 'var(--color-text)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flex: 1,
            justifyContent: 'center',
            minWidth: 120
          }}
        >
          <Share2 size={16} />
          Enlace
        </motion.button>
      </div>

      <div style={{ 
        background: 'rgba(30,30,30,0.8)', 
        borderRadius: '0.75rem', 
        padding: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        <h4 style={{ 
          fontSize: '0.8rem', 
          color: 'var(--color-text-muted)', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📊 MIS ESTADÍSTICAS
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--color-primary)', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              {estadisticas.totalInvitados}
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>Personas invitadas</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#00C896', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              {estadisticas.activosEsteMes}
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>Activas este mes</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#ffd700', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              ${(estadisticas.totalGanado || 0).toLocaleString('es-CO')}
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>Total ganado</p>
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'rgba(255,87,34,0.1)', 
        borderRadius: '0.75rem', 
        padding: '1.25rem',
        border: '1px solid rgba(255,87,34,0.2)'
      }}>
        <h4 style={{ 
          fontSize: '0.8rem', 
          color: 'var(--color-text)', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Gift size={16} /> CÓMO FUNCIONA
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            'Comparte tu código con amigos y familiares',
            'Tu amigo se registra usando tu código',
            '¡Tú ganas $10.000 y él gana $5.000!'
          ].map((step, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{
                background: 'var(--color-primary)',
                color: '#fff',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                flexShrink: 0
              }}>
                {idx + 1}
              </span>
              <span style={{ color: 'var(--color-text)', fontSize: '0.9rem' }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: '0 auto',
            fontSize: '0.9rem'
          }}
        >
          Ver mi árbol de referidos <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  )
}