import { useGameStore } from '../stores/gameStore'
import './TouchControls.css'

export function TouchControls({ onDirection }) {
  const gameState = useGameStore(state => state.gameState)

  if (gameState !== 'playing') return null

  const handleTouch = (direction) => (e) => {
    e.preventDefault()
    onDirection(direction)
  }

  return (
    <div className="touch-controls">
      <div className="touch-controls-inner">
        <button 
          className="touch-btn touch-up" 
          onTouchStart={handleTouch(0)}
          onClick={handleTouch(0)}
        >
          ▲
        </button>
        <div className="touch-middle-row">
          <button 
            className="touch-btn touch-left" 
            onTouchStart={handleTouch(3)}
            onClick={handleTouch(3)}
          >
            ◀
          </button>
          <div className="touch-center"></div>
          <button 
            className="touch-btn touch-right" 
            onTouchStart={handleTouch(1)}
            onClick={handleTouch(1)}
          >
            ▶
          </button>
        </div>
        <button 
          className="touch-btn touch-down" 
          onTouchStart={handleTouch(2)}
          onClick={handleTouch(2)}
        >
          ▼
        </button>
      </div>
    </div>
  )
}
