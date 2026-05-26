import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, Clock, CheckCircle, XCircle, AlertCircle, Pizza, Gift, Sparkles, ShoppingCart } from 'lucide-react'
import { formatCOP } from '../utils/formatters'
import { getTierColor } from '../utils/tierColors'
import { grupoService } from '../services/services'
import toast from 'react-hot-toast'

const getGrupoIcon = (emoji) => {
  switch (emoji) {
    case '🍕':
      return <Pizza size={24} color="#FF5722" />
    case '🎉':
      return <Sparkles size={24} color="#FF9800" />
    case '👕':
      return <ShoppingCart size={24} color="#2196F3" />
    case '🎁':
      return <Gift size={24} color="#E91E63" />
    case '🛒':
      return <ShoppingCart size={24} color="#4CAF50" />
    case '🎂':
      return <Gift size={24} color="#9C27B0" />
    default:
      return <Users size={24} color="#888" />
  }
}

export default function GrupoCard({ grupo, index = 0, onPaymentSuccess }) {
  const {
    id,
    nombre,
    emoji,
    organizador,
    totalMiembros,
    miembrosPagados,
    tuMonto,
    expiresAt,
    estado,
    tuEstado
  } = grupo

  const [pagando, setPagando] = useState(false)

  const handlePagar = async () => {
    setPagando(true)
    try {
      await grupoService.pagar(id)
      toast.success('¡Parte pagada con éxito con tus Puntos Tribu!')
      if (onPaymentSuccess) {
        onPaymentSuccess()
      } else {
        window.location.reload()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al procesar el pago')
    } finally {
      setPagando(false)
    }
  }

  const expiraEn = new Date(expiresAt)
  const ahora = new Date()
  const horasRestantes = Math.max(0, Math.floor((expiraEn - ahora) / (1000 * 60 * 60)))
  const minutosRestantes = Math.max(0, Math.floor(((expiraEn - ahora) % (1000 * 60 * 60)) / (1000 * 60)))

  const getBorderColor = () => {
    if (estado === 'COMPLETADO') return '#1D9E75'
    if (horasRestantes < 2) return '#E24B4A'
    return '#FFB84D'
  }

  const getEstadoIcon = () => {
    if (tuEstado === 'PAGADO') return <CheckCircle size={18} color="#1D9E75" />
    if (estado === 'COMPLETADO') return <CheckCircle size={18} color="#1D9E75" />
    if (horasRestantes < 2) return <XCircle size={18} color="#E24B4A" />
    return <AlertCircle size={18} color="#FFB84D" />
  }

  const progress = (miembrosPagados / totalMiembros) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        background: 'var(--color-background-primary, #1a1a1a)',
        border: `1px solid ${getBorderColor()}40`,
        borderLeft: `4px solid ${getBorderColor()}`,
        borderRadius: 16,
        padding: '1.25rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'var(--color-background-secondary, #2a2a2a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {getGrupoIcon(emoji)}
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
            {nombre}
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#888' }}>
            Organizador: {organizador}
          </p>
        </div>
        {getEstadoIcon()}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: 6,
          fontSize: '0.8rem',
          color: '#888'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={14} />
            {miembrosPagados} de {totalMiembros} pagaron
          </span>
          <span style={{ color: getBorderColor() }}>
            {horasRestantes > 0 ? `${horasRestantes}h ${minutosRestantes}m` : 'Por vencer'}
          </span>
        </div>
        <div style={{
          height: 6,
          background: 'var(--color-background-secondary, #2a2a2a)',
          borderRadius: 3,
          overflow: 'hidden'
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            style={{
              height: '100%',
              background: getBorderColor(),
              borderRadius: 3
            }}
          />
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: 12,
        borderTop: '0.5px solid var(--color-border-tertiary, #333)'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#888' }}>Tu parte: </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
            {formatCOP(tuMonto)}
          </span>
        </div>
        
        {tuEstado !== 'PAGADO' ? (
          <motion.button
            whileHover={{ scale: pagando ? 1 : 1.02 }}
            whileTap={{ scale: pagando ? 1 : 0.98 }}
            disabled={pagando}
            onClick={handlePagar}
            style={{
              background: pagando ? '#666' : 'var(--color-primary, #ff5722)',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: pagando ? 'not-allowed' : 'pointer'
            }}
          >
            {pagando ? 'Pagando...' : 'Pagar con Puntos'}
          </motion.button>
        ) : (
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#1D9E75',
            fontWeight: 600 
          }}>
            ✓ Pagado
          </span>
        )}
      </div>
    </motion.div>
  )
}
