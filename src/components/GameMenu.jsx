import { useGameStore } from '../stores/gameStore'

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
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 200
    }}>
      {/* Title */}
      {gameState === 'menu' && (
        <>
          <h1 style={{
            fontSize: '48px',
            color: '#4a7c59',
            marginBottom: '5px',
            textShadow: '0 0 20px rgba(74, 124, 89, 0.5)'
          }}>
            🐼 Panda Maze Escape
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#888',
            marginBottom: '5px',
            fontFamily: 'monospace'
          }}>
            Version {VERSION}
          </p>
          <p style={{
            fontSize: '18px',
            color: '#aaa',
            marginBottom: '40px'
          }}>
            Help the panda escape the bamboo maze!
          </p>
          <div style={{
            backgroundColor: 'rgba(74, 124, 89, 0.2)',
            padding: '20px 40px',
            borderRadius: '10px',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#ccc', margin: '5px 0' }}>⏱️ You have 3 minutes to escape</p>
            <p style={{ color: '#ccc', margin: '5px 0' }}>🎮 Tap WASD or Arrow Keys to move</p>
            <p style={{ color: '#ccc', margin: '5px 0' }}>🕹️ Pac-Man style: tap direction to go!</p>
            <p style={{ color: '#ccc', margin: '5px 0' }}>🗺️ Follow the minimap to find the exit</p>
            <p style={{ color: '#00ff88', margin: '5px 0' }}>✨ Reach the green portal to win!</p>
          </div>
        </>
      )}
      
      {/* Win Screen */}
      {gameState === 'won' && (
        <>
          <h1 style={{
            fontSize: '56px',
            color: '#00ff88',
            marginBottom: '20px',
            textShadow: '0 0 30px rgba(0, 255, 136, 0.7)'
          }}>
            🎉 You Escaped! 🎉
          </h1>
          <p style={{
            fontSize: '24px',
            color: '#aaa',
            marginBottom: '10px'
          }}>
            The panda is free!
          </p>
          <p style={{
            fontSize: '20px',
            color: '#4a7c59',
            marginBottom: '40px'
          }}>
            Time remaining: {formatTime(timeRemaining)}
          </p>
        </>
      )}
      
      {/* Lose Screen */}
      {gameState === 'lost' && (
        <>
          <h1 style={{
            fontSize: '56px',
            color: '#ff4444',
            marginBottom: '20px',
            textShadow: '0 0 30px rgba(255, 68, 68, 0.7)'
          }}>
            ⏰ Time's Up!
          </h1>
          <p style={{
            fontSize: '24px',
            color: '#aaa',
            marginBottom: '40px'
          }}>
            The panda got lost in the maze...
          </p>
        </>
      )}
      
      {/* Buttons */}
      <button
        onClick={startGame}
        style={{
          padding: '15px 50px',
          fontSize: '24px',
          backgroundColor: '#4a7c59',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 4px 15px rgba(74, 124, 89, 0.4)'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#5a9c69'
          e.target.style.transform = 'scale(1.05)'
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = '#4a7c59'
          e.target.style.transform = 'scale(1)'
        }}
      >
        {gameState === 'menu' ? '🎮 Start Game' : '🔄 Play Again'}
      </button>
      
      {/* Footer version on all screens */}
      <p style={{
        position: 'absolute',
        bottom: '20px',
        fontSize: '12px',
        color: '#555',
        fontFamily: 'monospace'
      }}>
        Panda Maze Escape v{VERSION}
      </p>
    </div>
  )
}
