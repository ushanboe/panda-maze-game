// Sound Manager - Synthesized sounds using Web Audio API
// No external files needed!

class SoundManagerClass {
  constructor() {
    this.audioContext = null
    this.enabled = true
    this.initialized = false
  }

  init() {
    if (this.initialized) return
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.initialized = true
    } catch (e) {
      console.warn('Web Audio API not supported')
      this.enabled = false
    }
  }

  // Resume audio context (needed after user interaction)
  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  // Play a tone with envelope
  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.enabled || !this.audioContext) return
    this.resume()

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type

    const now = this.audioContext.currentTime
    gainNode.gain.setValueAtTime(volume, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)

    oscillator.start(now)
    oscillator.stop(now + duration)
  }

  // Play multiple tones in sequence
  playMelody(notes, baseVolume = 0.3) {
    if (!this.enabled || !this.audioContext) return
    this.resume()

    let time = this.audioContext.currentTime
    notes.forEach(([freq, duration, type = 'sine']) => {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.value = freq
      oscillator.type = type

      gainNode.gain.setValueAtTime(baseVolume, time)
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration)

      oscillator.start(time)
      oscillator.stop(time + duration)

      time += duration * 0.8 // Slight overlap
    })
  }

  // === GAME SOUNDS ===

  // Game Start - Upbeat jingle
  gameStart() {
    this.playMelody([
      [523, 0.15, 'square'],  // C5
      [659, 0.15, 'square'],  // E5
      [784, 0.15, 'square'],  // G5
      [1047, 0.3, 'square'], // C6
    ], 0.2)
  }

  // Wall Bump - Soft thud
  wallBump() {
    if (!this.enabled || !this.audioContext) return
    this.resume()

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = 80
    oscillator.type = 'sine'

    const now = this.audioContext.currentTime
    gainNode.gain.setValueAtTime(0.3, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    oscillator.start(now)
    oscillator.stop(now + 0.15)
  }

  // Coin Collect - Cha-ching!
  coinCollect(value = 100) {
    // Higher value = higher pitch
    const basePitch = 800 + (value / 10)
    this.playMelody([
      [basePitch, 0.08, 'square'],
      [basePitch * 1.5, 0.12, 'square'],
    ], 0.25)
  }

  // Treasure Chest 10K - Epic explosion + coins
  treasureChest10K() {
    // Explosion rumble
    if (!this.enabled || !this.audioContext) return
    this.resume()

    // Low rumble
    const noise = this.audioContext.createOscillator()
    const noiseGain = this.audioContext.createGain()
    noise.connect(noiseGain)
    noiseGain.connect(this.audioContext.destination)
    noise.frequency.value = 60
    noise.type = 'sawtooth'
    const now = this.audioContext.currentTime
    noiseGain.gain.setValueAtTime(0.4, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
    noise.start(now)
    noise.stop(now + 0.5)

    // Coin shower melody
    setTimeout(() => {
      this.playMelody([
        [523, 0.1, 'square'],
        [659, 0.1, 'square'],
        [784, 0.1, 'square'],
        [880, 0.1, 'square'],
        [1047, 0.1, 'square'],
        [1175, 0.1, 'square'],
        [1319, 0.2, 'square'],
      ], 0.3)
    }, 200)
  }

  // Treasure Chest 50K - MEGA jackpot!
  treasureChest50K() {
    if (!this.enabled || !this.audioContext) return
    this.resume()

    // Big explosion
    const noise = this.audioContext.createOscillator()
    const noiseGain = this.audioContext.createGain()
    noise.connect(noiseGain)
    noiseGain.connect(this.audioContext.destination)
    noise.frequency.value = 40
    noise.type = 'sawtooth'
    const now = this.audioContext.currentTime
    noiseGain.gain.setValueAtTime(0.5, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
    noise.start(now)
    noise.stop(now + 0.8)

    // Epic fanfare
    setTimeout(() => {
      this.playMelody([
        [392, 0.15, 'square'],  // G4
        [392, 0.15, 'square'],  // G4
        [392, 0.15, 'square'],  // G4
        [523, 0.4, 'square'],   // C5
        [466, 0.15, 'square'],  // Bb4
        [440, 0.15, 'square'],  // A4
        [392, 0.15, 'square'],  // G4
        [523, 0.5, 'square'],   // C5
      ], 0.35)
    }, 300)

    // Extra sparkle
    setTimeout(() => {
      this.playMelody([
        [1047, 0.1, 'sine'],
        [1319, 0.1, 'sine'],
        [1568, 0.1, 'sine'],
        [2093, 0.3, 'sine'],
      ], 0.2)
    }, 1200)
  }

  // Game Win - Victory fanfare
  gameWin() {
    this.playMelody([
      [523, 0.2, 'square'],   // C5
      [523, 0.2, 'square'],   // C5
      [523, 0.2, 'square'],   // C5
      [523, 0.4, 'square'],   // C5
      [415, 0.4, 'square'],   // Ab4
      [466, 0.4, 'square'],   // Bb4
      [523, 0.2, 'square'],   // C5
      [466, 0.2, 'square'],   // Bb4
      [523, 0.6, 'square'],   // C5
    ], 0.3)
  }

  // Game Lose - Sad trombone
  gameLose() {
    this.playMelody([
      [392, 0.4, 'sawtooth'],  // G4
      [370, 0.4, 'sawtooth'],  // F#4
      [349, 0.4, 'sawtooth'],  // F4
      [330, 0.8, 'sawtooth'],  // E4
    ], 0.25)
  }

  // Toggle sound on/off
  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  }
}

// Singleton instance
export const SoundManager = new SoundManagerClass()
