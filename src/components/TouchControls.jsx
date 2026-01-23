import { useGameStore } from '../stores/gameStore'
import './TouchControls.css'

export function TouchControls({ onDirection }) {
  const gameState = useGameStore(state => state.gameState)

  if (gameState !== 'playing') return null

  const handleTouch = (direction) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    onDirection(direction)
  }

  return (
    <div className="touch-controls">
      {/* Left side - LEFT button */}
      <div className="touch-left-zone">
        <button 
          className="touch-btn touch-btn-large" 
          onTouchStart={handleTouch(3)}
          onClick={handleTouch(3)}
        >
          ◀
        </button>
      </div>

      {/* Right side - UP, DOWN, RIGHT buttons */}
      <div className="touch-right-zone">
        <button 
          className="touch-btn" 
          onTouchStart={handleTouch(0)}
          onClick={handleTouch(0)}
        >
          ▲
        </button>
        <div className="touch-right-row">
          <button 
            className="touch-btn" 
            onTouchStart={handleTouch(2)}
            onClick={handleTouch(2)}
          >
            ▼
          </button>
          <button 
            className="touch-btn" 
            onTouchStart={handleTouch(1)}
            onClick={handleTouch(1)}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  )
}
