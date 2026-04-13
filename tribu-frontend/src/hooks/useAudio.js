import { useRef, useCallback, useEffect } from 'react'

const SONIDOS = {
  CASHBACK:       '/sounds/coins.mp3',
  RULETA:         '/sounds/jackpot.mp3',
  TIER_PROMOCION: '/sounds/levelup.mp3',
  REFERIDO:       '/sounds/bonus.mp3',
  REEMBOLSO:      '/sounds/coins.mp3'
}

export function useAudio() {
  const audioRef = useRef({})
  const enabledRef = useRef(true)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    enabledRef.current = !mediaQuery.matches
  }, [])

  const reproducir = useCallback((tipo) => {
    if (!enabledRef.current) return
    
    const src = SONIDOS[tipo]
    if (!src) return

    if (!audioRef.current[tipo]) {
      audioRef.current[tipo] = new Audio(src)
      audioRef.current[tipo].volume = 0.4
    }

    const audio = audioRef.current[tipo]
    audio.currentTime = 0
    audio.play().catch(() => {})
  }, [])

  return { reproducir }
}
