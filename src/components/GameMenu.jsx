import { useGameStore } from '../stores/gameStore'
import { SoundManager } from '../utils/SoundManager'
import './GameMenu.css'

const VERSION = '1.5'

export function GameMenu() {
  const gameState = useGameStore(state => state.gameState)
  const timeRemaining = useGameStore(state => state.timeRemaining)
  const timeTaken = useGameStore(state => state.timeTaken)
  const score = useGameStore(state => state.score)
  const coinsCollected = useGameStore(state => state.coinsCollected)
  const chestsCollected = useGameStore(state => state.chestsCollected)
  const startGame = useGameStore(state => state.startGame)
  const addTimeBonus = useGameStore(state => state.addTimeBonus)

  if (gameState === 'playing') return null

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    SoundManager.init()
    SoundManager.resume()
    startGame()
  }

  // Calculate time bonus (remaining seconds × 10)
  const timeBonus = gameState === 'won' ? timeRemaining * 10 : 0
  const totalScore = score + timeBonus

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
                <span className="instruction-icon">🪙</span>
                <span>Collect coins & treasure</span>
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

              <div className="stats-container">
                <div className="stat-row">
                  <span className="stat-icon">⏱️</span>
                  <span className="stat-name">Time</span>
                  <span className="stat-val">{formatTime(timeTaken)}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-icon">🪙</span>
                  <span className="stat-name">Coins</span>
                  <span className="stat-val">{coinsCollected}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-icon">📦</span>
                  <span className="stat-name">Chests</span>
                  <span className="stat-val">{chestsCollected}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-icon">💰</span>
                  <span className="stat-name">Points</span>
                  <span className="stat-val">{score.toLocaleString()}</span>
                </div>
                <div className="stat-row bonus">
                  <span className="stat-icon">⭐</span>
                  <span className="stat-name">Time Bonus</span>
                  <span className="stat-val">+{timeBonus.toLocaleString()}</span>
                </div>
                <div className="stat-row total">
                  <span className="stat-icon">🏆</span>
                  <span className="stat-name">TOTAL</span>
                  <span className="stat-val">{totalScore.toLocaleString()}</span>
                </div>
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

              <div className="stats-container">
                <div className="stat-row">
                  <span className="stat-icon">🪙</span>
                  <span className="stat-name">Coins</span>
                  <span className="stat-val">{coinsCollected}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-icon">📦</span>
                  <span className="stat-name">Chests</span>
                  <span className="stat-val">{chestsCollected}</span>
                </div>
                <div className="stat-row total">
                  <span className="stat-icon">💰</span>
                  <span className="stat-name">Points</span>
                  <span className="stat-val">{score.toLocaleString()}</span>
                </div>
              </div>
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
