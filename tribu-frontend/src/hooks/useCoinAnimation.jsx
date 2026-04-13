import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function CoinParticle({ coin, cardRef }) {
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (cardRef?.current) {
      const rect = cardRef.current.getBoundingClientRect()
      setTargetPos({
        x: rect.left + rect.width / 2 - coin.x,
        y: rect.top + rect.height / 2 - coin.y
      })
    }
  }, [cardRef, coin.x, coin.y])

  return (
    <motion.div
      initial={{ 
        x: coin.x - window.innerWidth / 2, 
        y: coin.y - window.innerHeight / 2,
        scale: 1,
        opacity: 1
      }}
      animate={{
        x: targetPos.x,
        y: targetPos.y,
        scale: 0.3,
        opacity: 0
      }}
      transition={{ 
        duration: 0.8, 
        delay: coin.delay,
        ease: 'easeIn'
      }}
      style={{
        position: 'fixed',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #ffd700, #daa520)',
        boxShadow: '0 0 10px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
        zIndex: 9996,
        left: '50%',
        top: '50%',
      }}
    />
  )
}

export function CoinParticles({ coins, cardRef }) {
  return (
    <AnimatePresence>
      {coins.map(coin => (
        <CoinParticle key={coin.id} coin={coin} cardRef={cardRef} />
      ))}
    </AnimatePresence>
  )
}

export function useCoinAnimation(cardRef) {
  const [coins, setCoins] = useState([])
  const animationRef = useRef(null)

  const dispararMonedas = useCallback((origen, cantidad = 8) => {
    const nuevasMonedas = Array.from({ length: cantidad }, (_, i) => ({
      id: Date.now() + i,
      x: origen.x + (Math.random() - 0.5) * 100,
      y: origen.y + (Math.random() - 0.5) * 100,
      delay: i * 0.06
    }))
    
    setCoins(prev => [...prev, ...nuevasMonedas])

    if (animationRef.current) {
      clearTimeout(animationRef.current)
    }
    
    animationRef.current = setTimeout(() => {
      setCoins(prev => prev.filter(c => !nuevasMonedas.find(n => n.id === c.id)))
    }, 1500)
  }, [])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [])

  return { coins, dispararMonedas }
}
