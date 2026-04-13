import { useEffect, useState, useCallback, useRef } from 'react'
import { useNotification } from '../context/NotificationContext'
import { useCoinAnimation, CoinParticles } from './useCoinAnimation'

export function useWebSocketAnimation({ cardRef, onSaldoUpdate }) {
  const { ultimoEvento } = useNotification()
  const { coins, dispararMonedas } = useCoinAnimation(cardRef)
  const [tierPromocion, setTierPromocion] = useState(null)
  const [mostrarConfeti, setMostrarConfeti] = useState(false)
  const tierTimeoutRef = useRef(null)
  const confetiTimeoutRef = useRef(null)

  const reducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false

  useEffect(() => {
    if (!ultimoEvento || reducedMotion) return

    const { tipo, nuevoSaldo } = ultimoEvento

    switch (tipo) {
      case 'CASHBACK':
        DispararMonedasCentral(12)
        onSaldoUpdate?.(nuevoSaldo)
        break

      case 'RULETA':
      case 'PREMIO_RULETA':
      case 'ROULETTE_REWARD':
        DispararMonedasCentral(20)
        setMostrarConfeti(true)
        if (confetiTimeoutRef.current) clearTimeout(confetiTimeoutRef.current)
        confetiTimeoutRef.current = setTimeout(() => setMostrarConfeti(false), 3000)
        onSaldoUpdate?.(nuevoSaldo)
        break

      case 'REFERIDO':
      case 'REFERIDO_EXITOSO':
      case 'REFERRAL_BONUS':
        DispararMonedasCentral(8)
        onSaldoUpdate?.(nuevoSaldo)
        break

      case 'REEMBOLSO':
        DispararMonedasCentral(6)
        onSaldoUpdate?.(nuevoSaldo)
        break

      case 'TIER_PROMOCION':
      case 'TIER_AJUSTE':
        setMostrarConfeti(true)
        setTierPromocion(ultimoEvento.descripcion)
        if (tierTimeoutRef.current) clearTimeout(tierTimeoutRef.current)
        if (confetiTimeoutRef.current) clearTimeout(confetiTimeoutRef.current)
        tierTimeoutRef.current = setTimeout(() => {
          setMostrarConfeti(false)
          setTierPromocion(null)
        }, 4000)
        break

      case 'STREAK_BONUS':
        DispararMonedasCentral(6)
        window.dispatchEvent(new CustomEvent('streak-bonus'))
        onSaldoUpdate?.(nuevoSaldo)
        break

      case 'STREAK_ROTO':
        setTierPromocion(ultimoEvento.descripcion)
        if (tierTimeoutRef.current) clearTimeout(tierTimeoutRef.current)
        tierTimeoutRef.current = setTimeout(() => {
          setTierPromocion(null)
        }, 3000)
        break

      case 'LEADERBOARD_REWARD':
        DispararMonedasCentral(15)
        setMostrarConfeti(true)
        if (confetiTimeoutRef.current) clearTimeout(confetiTimeoutRef.current)
        confetiTimeoutRef.current = setTimeout(() => setMostrarConfeti(false), 3000)
        onSaldoUpdate?.(nuevoSaldo)
        break

      case 'TRANSFERENCIA_RECIBIDA':
        DispararMonedasCentral(8, '#378ADD')
        onSaldoUpdate?.(nuevoSaldo)
        break

      case 'GRUPO_CONFIRMADO':
        DispararMonedasCentral(20)
        setMostrarConfeti(true)
        if (confetiTimeoutRef.current) clearTimeout(confetiTimeoutRef.current)
        confetiTimeoutRef.current = setTimeout(() => setMostrarConfeti(false), 3000)
        onSaldoUpdate?.(nuevoSaldo)
        break

      case 'MISION_COMPLETADA':
        DispararMonedasCentral(12)
        setMostrarConfeti(true)
        if (confetiTimeoutRef.current) clearTimeout(confetiTimeoutRef.current)
        confetiTimeoutRef.current = setTimeout(() => setMostrarConfeti(false), 4000)
        break

      default:
        break
    }
  }, [ultimoEvento, reducedMotion])

  const DispararMonedasCentral = useCallback((cantidad) => {
    if (reducedMotion) return
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    disparaDispararMonedas({ x: centerX, y: centerY }, cantidad)
  }, [reducedMotion])

  const disparaDispararMonedas = useCallback((origen, cantidad) => {
    if (cardRef?.current && !reducedMotion) {
      dispararMonedas(origen, cantidad)
    }
  }, [cardRef, reducedMotion, DispararMonedasCentral])

  useEffect(() => {
    return () => {
      if (tierTimeoutRef.current) clearTimeout(tierTimeoutRef.current)
      if (confetiTimeoutRef.current) clearTimeout(confetiTimeoutRef.current)
    }
  }, [])

  return { 
    tierPromocion, 
    mostrarConfeti,
    coins,
    CoinParticlesComponent: () => <CoinParticles coins={coins} cardRef={cardRef} />
  }
}
