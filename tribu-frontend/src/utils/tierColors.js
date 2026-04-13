export const TIER_COLORS = {
  BRONCE: { primary: '#cd7f32', light: '#f5deb3', dark: '#8b4513', glow: '#cd7f3240' },
  PLATA:  { primary: '#c0c0c0', light: '#f0f0f0', dark: '#808080', glow: '#c0c0c040' },
  ORO:    { primary: '#ffd700', light: '#fff8dc', dark: '#b8860b', glow: '#ffd70040' }
}

export const getTierColor = (tier) => TIER_COLORS[tier] || TIER_COLORS.BRONCE

export const getTierFromOrden = (orden) => {
  if (orden >= 3) return 'ORO'
  if (orden >= 2) return 'PLATA'
  return 'BRONCE'
}
