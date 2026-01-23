import { useGameStore } from '../stores/gameStore'
import './PointPopup.css'

export function PointPopups() {
  const pointPopups = useGameStore(state => state.pointPopups)

  return (
    <div className="point-popups-container">
      {pointPopups.map(popup => (
        <PointPopup key={popup.id} value={popup.value} />
      ))}
    </div>
  )
}

function PointPopup({ value }) {
  // Format with + and commas
  const formatValue = (num) => {
    return '+' + num.toLocaleString()
  }

  // Color based on value
  const getColor = () => {
    if (value >= 50000) return '#ff00ff' // Mega purple
    if (value >= 10000) return '#ffd700' // Gold
    if (value >= 1000) return '#e5e4e2'  // Platinum
    if (value >= 500) return '#ffd700'   // Gold
    if (value >= 250) return '#c0c0c0'   // Silver
    return '#cd7f32' // Bronze
  }

  // Size based on value
  const getSize = () => {
    if (value >= 50000) return '48px'
    if (value >= 10000) return '40px'
    if (value >= 1000) return '32px'
    return '24px'
  }

  return (
    <div 
      className="point-popup"
      style={{ 
        color: getColor(),
        fontSize: getSize(),
        textShadow: `0 0 20px ${getColor()}`
      }}
    >
      {formatValue(value)}
    </div>
  )
}
