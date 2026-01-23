import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'

export function HUD() {
  const timeRemaining = useGameStore(state => state.timeRemaining)
  const gameState = useGameStore(state => state.gameState)
  const decrementTime = useGameStore(state => state.decrementTime)

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing') return

    const interval = setInterval(() => {
      decrementTime()
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState, decrementTime])

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Determine timer color based on time remaining
  const getTimerColor = () => {
    if (timeRemaining <= 30) return '#ff4444'
    if (timeRemaining <= 60) return '#ffaa00'
    return '#ffffff'
  }

  const isWarning = timeRemaining <= 30

  return (
    <>
      {/* Timer - Top Right Corner */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '8px 16px',
        borderRadius: '8px',
        border: `2px solid ${getTimerColor()}`,
        textAlign: 'center',
        animation: isWarning ? 'pulse 0.5s infinite' : 'none'
      }}>
        <div style={{
          fontSize: '10px',
          color: '#aaa',
          marginBottom: '2px',
          letterSpacing: '1px'
        }}>
          TIME
        </div>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: getTimerColor(),
          fontFamily: 'monospace',
          textShadow: isWarning ? `0 0 10px ${getTimerColor()}` : 'none'
        }}>
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </>
  )
}
