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
  
  // Actions
  startGame: () => set({
    gameState: 'playing',
    timeRemaining: GAME_DURATION,
    trail: [{ x: 0, z: 0 }],
    playerPosition: { x: 0, z: 0 },
    playerRotation: 0
  }),
  
  resetGame: () => set({
    gameState: 'menu',
    timeRemaining: GAME_DURATION,
    trail: [],
    playerPosition: { x: 0, z: 0 },
    playerRotation: 0
  }),
  
  winGame: () => set({ gameState: 'won' }),
  
  loseGame: () => set({ gameState: 'lost' }),
  
  decrementTime: () => {
    const { timeRemaining, gameState } = get()
    if (gameState === 'playing' && timeRemaining > 0) {
      const newTime = timeRemaining - 1
      if (newTime <= 0) {
        set({ timeRemaining: 0, gameState: 'lost' })
      } else {
        set({ timeRemaining: newTime })
      }
    }
  },
  
  updatePlayerPosition: (x, z, rotation) => {
    const { trail, maxTrailLength } = get()
    const lastPos = trail[trail.length - 1]
    
    // Only add to trail if moved enough distance
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
  }
}))
