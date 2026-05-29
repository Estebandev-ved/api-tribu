// Web Audio Context Singleton for real-time exotic sci-fi synthesizer sounds
let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/**
 * Ascending crystal chime arpeggio - played when a modal opens
 */
export const playExoticChime = () => {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Magical crystal arpeggio: C Major 9 ascending
    const freqs = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99, 987.77, 1046.50]
    
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.06)
      
      // Fine detuning for celestial shimmer
      osc.detune.setValueAtTime(Math.random() * 8 - 4, now + idx * 0.06)

      gain.gain.setValueAtTime(0, now + idx * 0.06)
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.06 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.5)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.06)
      osc.stop(now + idx * 0.06 + 0.6)
    })
  } catch (error) {
    console.warn("Audio Context blocked or not supported:", error)
  }
}

/**
 * Futuristic organic sweep click - played on micro-interactions or taps
 */
export const playExoticClick = () => {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.12)

    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.15)
  } catch (e) {
    console.warn(e)
  }
}

/**
 * Retro-futuristic synthwave fanfare - played when achieving a milestone
 */
export const playEpicFanfare = () => {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Warm detuned sawtooth G Major chord (synth horns style)
    const baseFreqs = [196.00, 293.66, 392.00, 493.88, 587.33]

    baseFreqs.forEach((freq, idx) => {
      [-3, 3].forEach(detune => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()

        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(freq, now)
        osc.detune.setValueAtTime(detune, now)

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(700, now)
        filter.frequency.exponentialRampToValueAtTime(1600, now + 0.25)

        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(0.05, now + 0.12)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 1.1)
      })
    })
  } catch (e) {
    console.warn(e)
  }
}
