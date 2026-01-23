import { useGameStore } from '../stores/gameStore'
import './ScoreDisplay.css'

export function ScoreDisplay() {
  const score = useGameStore(state => state.score)
  const gameState = useGameStore(state => state.gameState)

  if (gameState !== 'playing') return null

  // Format score with commas
  const formatScore = (num) => {
    return num.toLocaleString()
  }

  return (
    <div className="score-display">
      <div className="score-label">SCORE</div>
      <div className="score-value">{formatScore(score)}</div>
    </div>
  )
}
