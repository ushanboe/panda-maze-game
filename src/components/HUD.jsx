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
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100
    }}>
      {/* Timer */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px 30px',
        borderRadius: '10px',
        border: `2px solid ${getTimerColor()}`,
        textAlign: 'center',
        animation: isWarning ? 'pulse 0.5s infinite' : 'none'
      }}>
        <div style={{
          fontSize: '14px',
          color: '#aaa',
          marginBottom: '4px'
        }}>
          TIME REMAINING
        </div>
        <div style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: getTimerColor(),
          fontFamily: 'monospace',
          textShadow: isWarning ? `0 0 10px ${getTimerColor()}` : 'none'
        }}>
          {formatTime(timeRemaining)}
        </div>
      </div>
      
      {/* Controls hint */}
      <div style={{
        marginTop: '10px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#888'
      }}>
        Use WASD or Arrow Keys to move
      </div>
      
      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
