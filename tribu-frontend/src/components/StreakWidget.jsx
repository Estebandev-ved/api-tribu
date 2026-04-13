import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api'

export default function StreakWidget() {
  const [racha, setRacha] = useState(null)
  const [loading, setLoading] = useState(true)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    fetchRacha()
  }, [])

  const fetchRacha = async () => {
    try {
      const res = await api.get('/usuarios/mi-racha')
      setRacha(res.data)
    } catch (err) {
      console.error('Error fetching racha:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleStreakBonus = () => {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 1500)
    }
    window.addEventListener('streak-bonus', handleStreakBonus)
    return () => window.removeEventListener('streak-bonus', handleStreakBonus)
  }, [])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg animate-pulse">
        <div className="h-20 bg-white/20 rounded-lg mb-4"></div>
        <div className="h-4 bg-white/20 rounded w-3/4"></div>
      </div>
    )
  }

  const dias = racha?.rachaActual || 0
  const maxima = racha?.rachaMaxima || 0
  const diasProximo = racha?.proximoBonusDias || 0
  const montoProximo = racha?.proximoBonusMonto || 0

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🔥</span>
          <h3 className="font-bold text-lg">Tu Racha</h3>
        </div>

        <motion.div 
          className="text-6xl font-black mb-2"
          animate={animating ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          {dias}
        </motion.div>

        <div className="flex gap-1 mb-4">
          {[...Array(Math.min(dias, 7))].map((_, i) => (
            <motion.span 
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="text-xl"
            >🔥</motion.span>
          ))}
        </div>

        {dias === 0 ? (
          <p className="text-white/80 text-sm">
            ¡Empieza tu racha hoy haciendo una compra!
          </p>
        ) : diasProximo > 0 ? (
          <p className="text-white/80 text-sm">
            <span className="font-bold text-white">{diasProximo}</span> días más → 
            <span className="font-bold text-yellow-200"> ${montoProximo.toLocaleString()}</span>
          </p>
        ) : (
          <p className="text-white/80 text-sm font-bold">
            🎉 ¡Has alcanzado un bonus máximo!
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-white/60">Récord personal: <span className="text-white font-bold">{maxima} días</span></p>
        </div>
      </div>
    </div>
  )
}
