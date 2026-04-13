import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TribuCard from './TribuCard'

const PARTICULAS = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * 360,
  distance: 80 + Math.random() * 40,
  delay: i * 0.05,
  color: ['#cd7f32', '#ffd700', '#c0c0c0'][i % 3]
}))

export default function TribuCardMinting({ saldo = 0, tierActual }) {
  const [mostrar, setMostrar] = useState(
    !localStorage.getItem('tribu_card_minted')
  )

  const completarMinting = () => {
    localStorage.setItem('tribu_card_minted', 'true')
    setMostrar(false)
  }

  if (!mostrar) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
        }}
      >
        {PARTICULAS.map((p, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: 0, 
              y: 0, 
              scale: 0,
              opacity: 0 
            }}
            animate={{ 
              x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
              y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 0.8,
              delay: 0.6 + p.delay,
              ease: 'easeOut'
            }}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: p.color,
              boxShadow: `0 0 6px ${p.color}`,
            }}
          />
        ))}

        <motion.div
          initial={{ scale: 0.3, rotateY: 180, opacity: 0 }}
          animate={{ scale: 1, rotateY: 0, opacity: 1 }}
          transition={{ 
            duration: 0.8,
            delay: 1.4,
            type: 'spring',
            stiffness: 200,
            damping: 20
          }}
          style={{ marginBottom: '2rem' }}
        >
          <TribuCard saldo={saldo} tierActual={tierActual} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.2 }}
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          <h2 style={{ 
            color: '#fff', 
            fontSize: '1.8rem', 
            fontWeight: 900,
            margin: 0,
            textShadow: '0 0 20px rgba(255,215,0,0.5)'
          }}>
            Tu Tribu Card está lista
          </h2>
          <p style={{ 
            color: 'rgba(255,255,255,0.6)', 
            marginTop: '0.5rem',
            fontSize: '1rem'
          }}>
            ¡Ahora puedes recibir tus cashbacks y premios!
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 3 }}
          onClick={completarMinting}
          style={{
            background: 'linear-gradient(45deg, #FF5722, #FF9800)',
            border: 'none',
            padding: '1rem 3rem',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '1.2rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(255,87,34,0.4)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ¡Empezar!
        </motion.button>
      </motion.div>
    </AnimatePresence>
  )
}
