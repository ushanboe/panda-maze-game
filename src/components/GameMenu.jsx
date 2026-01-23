import { useGameStore } from '../stores/gameStore'
import './GameMenu.css'

const VERSION = '1.0'

export function GameMenu() {
  const gameState = useGameStore(state => state.gameState)
  const timeRemaining = useGameStore(state => state.timeRemaining)
  const startGame = useGameStore(state => state.startGame)
  const resetGame = useGameStore(state => state.resetGame)

  if (gameState === 'playing') return null

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Starting game...')
    startGame()
  }

  return (
    <div className="game-menu-overlay">
      <div className="game-menu-content">
        {/* Title Screen */}
        {gameState === 'menu' && (
          <>
            <div className="game-logo">
              <span className="logo-emoji">🐼</span>
              <h1 className="game-title">PANDA MAZE</h1>
              <p className="game-subtitle">ESCAPE</p>
            </div>

            <div className="game-instructions">
              <div className="instruction-item">
                <span className="instruction-icon">⏱️</span>
                <span>3 minutes to escape</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-icon">🎮</span>
                <span>Tap direction to move</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-icon">✨</span>
                <span>Find the green portal!</span>
              </div>
            </div>

            <button 
              className="game-btn game-btn-start" 
              onClick={handleStart}
              onTouchEnd={handleStart}
            >
              PLAY
            </button>
          </>
        )}

        {/* Win Screen */}
        {gameState === 'won' && (
          <>
            <div className="result-screen win">
              <span className="result-emoji">🎉</span>
              <h1 className="result-title">ESCAPED!</h1>
              <p className="result-subtitle">The panda is free!</p>
              <div className="result-stats">
                <span className="stat-label">Time Left</span>
                <span className="stat-value">{formatTime(timeRemaining)}</span>
              </div>
            </div>

            <button 
              className="game-btn game-btn-restart" 
              onClick={handleStart}
              onTouchEnd={handleStart}
            >
              PLAY AGAIN
            </button>
          </>
        )}

        {/* Lose Screen */}
        {gameState === 'lost' && (
          <>
            <div className="result-screen lose">
              <span className="result-emoji">😢</span>
              <h1 className="result-title">TIME'S UP</h1>
              <p className="result-subtitle">The panda got lost...</p>
            </div>

            <button 
              className="game-btn game-btn-restart" 
              onClick={handleStart}
              onTouchEnd={handleStart}
            >
              TRY AGAIN
            </button>
          </>
        )}

        <p className="version-text">v{VERSION}</p>
      </div>
    </div>
  )
}
