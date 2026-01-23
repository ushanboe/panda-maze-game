import { create } from 'zustand'

const GAME_DURATION = 180 // 3 minutes in seconds

export const useGameStore = create((set, get) => ({
  // Game state
  gameState: 'menu', // 'menu', 'playing', 'won', 'lost'
  timeRemaining: GAME_DURATION,

  // Player state
  playerPosition: { x: 0, z: 0 },
  playerRotation: 0,

  // Trail for minimap
  trail: [],
  maxTrailLength: 500,

  // Points System
  score: 0,
  coins: [],
  treasure10K: { x: 0, z: 0, collected: false, visible: true },
  treasure50K: { x: 0, z: 0, collected: false, visible: true }, // ALWAYS VISIBLE

  // Point popup queue
  pointPopups: [],

  // Stats for end screen
  coinsCollected: 0,
  chestsCollected: 0,
  timeTaken: 0,

  // Actions
  startGame: () => set({
    gameState: 'playing',
    timeRemaining: GAME_DURATION,
    trail: [{ x: 0, z: 0 }],
    playerPosition: { x: 0, z: 0 },
    playerRotation: 0,
    score: 0,
    coins: [],
    treasure10K: { x: 0, z: 0, collected: false, visible: true },
    treasure50K: { x: 0, z: 0, collected: false, visible: true },
    pointPopups: [],
    coinsCollected: 0,
    chestsCollected: 0,
    timeTaken: 0
  }),

  resetGame: () => set({
    gameState: 'menu',
    timeRemaining: GAME_DURATION,
    trail: [],
    playerPosition: { x: 0, z: 0 },
    playerRotation: 0,
    score: 0,
    coins: [],
    pointPopups: [],
    coinsCollected: 0,
    chestsCollected: 0,
    timeTaken: 0
  }),

  winGame: () => {
    const { timeRemaining } = get()
    const timeTaken = GAME_DURATION - timeRemaining
    set({ gameState: 'won', timeTaken })
  },

  loseGame: () => {
    set({ gameState: 'lost', timeTaken: GAME_DURATION })
  },

  decrementTime: () => {
    const { timeRemaining, gameState } = get()
    if (gameState === 'playing' && timeRemaining > 0) {
      const newTime = timeRemaining - 1
      if (newTime <= 0) {
        set({ timeRemaining: 0, gameState: 'lost', timeTaken: GAME_DURATION })
      } else {
        set({ timeRemaining: newTime })
      }
    }
  },

  updatePlayerPosition: (x, z, rotation) => {
    const { trail, maxTrailLength } = get()
    const lastPos = trail[trail.length - 1]

    const shouldAddToTrail = !lastPos ||
      Math.hypot(x - lastPos.x, z - lastPos.z) > 0.5

    const newTrail = shouldAddToTrail
      ? [...trail, { x, z }].slice(-maxTrailLength)
      : trail

    set({
      playerPosition: { x, z },
      playerRotation: rotation,
      trail: newTrail
    })
  },

  // Initialize coins for the maze
  initializeCoins: (coinData) => {
    console.log('Initializing coins:', coinData.length)
    set({ coins: coinData })
  },

  // Set treasure chest positions - BOTH VISIBLE FROM START
  setTreasurePositions: (pos10K, pos50K) => {
    console.log('Setting treasure positions:', { pos10K, pos50K })
    set({
      treasure10K: { x: pos10K.x, z: pos10K.z, collected: false, visible: true },
      treasure50K: { x: pos50K.x, z: pos50K.z, collected: false, visible: true }
    })
  },

  // Collect a coin
  collectCoin: (coinId) => {
    const { coins, score, coinsCollected, pointPopups } = get()
    const coin = coins.find(c => c.id === coinId)
    if (!coin || coin.collected) return null

    const newCoins = coins.map(c =>
      c.id === coinId ? { ...c, collected: true } : c
    )

    const newPopup = {
      id: Date.now(),
      value: coin.value,
      x: coin.x,
      z: coin.z
    }

    set({
      coins: newCoins,
      score: score + coin.value,
      coinsCollected: coinsCollected + 1,
      pointPopups: [...pointPopups, newPopup]
    })

    setTimeout(() => {
      set(state => ({
        pointPopups: state.pointPopups.filter(p => p.id !== newPopup.id)
      }))
    }, 1000)

    return coin.value
  },

  // Collect 10K treasure
  collectTreasure10K: () => {
    const { treasure10K, score, chestsCollected, pointPopups } = get()
    if (treasure10K.collected) return false

    const newPopup = {
      id: Date.now(),
      value: 10000,
      x: treasure10K.x,
      z: treasure10K.z
    }

    set({
      treasure10K: { ...treasure10K, collected: true },
      score: score + 10000,
      chestsCollected: chestsCollected + 1,
      pointPopups: [...pointPopups, newPopup]
    })

    setTimeout(() => {
      set(state => ({
        pointPopups: state.pointPopups.filter(p => p.id !== newPopup.id)
      }))
    }, 1500)

    return true
  },

  // Collect 50K treasure
  collectTreasure50K: () => {
    const { treasure50K, score, chestsCollected, pointPopups } = get()
    if (treasure50K.collected) return false

    const newPopup = {
      id: Date.now(),
      value: 50000,
      x: treasure50K.x,
      z: treasure50K.z
    }

    set({
      treasure50K: { ...treasure50K, collected: true },
      score: score + 50000,
      chestsCollected: chestsCollected + 1,
      pointPopups: [...pointPopups, newPopup]
    })

    setTimeout(() => {
      set(state => ({
        pointPopups: state.pointPopups.filter(p => p.id !== newPopup.id)
      }))
    }, 2000)

    return true
  },

  // Add time bonus to score
  addTimeBonus: () => {
    const { timeRemaining, score } = get()
    const bonus = timeRemaining * 10
    set({ score: score + bonus })
    return bonus
  }
}))
