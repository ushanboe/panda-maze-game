import { useGameStore } from '../stores/gameStore'
import { useMemo } from 'react'

const MINIMAP_SIZE = 150
const MINIMAP_SCALE = 3 // pixels per world unit

export function Minimap({ mazeData, walls }) {
  const trail = useGameStore(state => state.trail)
  const playerPosition = useGameStore(state => state.playerPosition)
  
  // Calculate bounds for the minimap
  const bounds = useMemo(() => {
    const halfWidth = (mazeData.width * 2) / 2
    const halfHeight = (mazeData.height * 2) / 2
    return { minX: -halfWidth, maxX: halfWidth, minZ: -halfHeight, maxZ: halfHeight }
  }, [mazeData])
  
  // Convert world position to minimap position
  const worldToMinimap = (x, z) => {
    const mapX = ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * MINIMAP_SIZE
    const mapY = ((z - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * MINIMAP_SIZE
    return { x: mapX, y: mapY }
  }
  
  // Exit position
  const exitWorldPos = {
    x: (mazeData.exit.x - mazeData.width / 2) * 2 + 1,
    z: (mazeData.exit.y - mazeData.height / 2) * 2 + 1
  }
  const exitPos = worldToMinimap(exitWorldPos.x, exitWorldPos.z)
  
  // Player position on minimap
  const playerMapPos = worldToMinimap(playerPosition.x, playerPosition.z)
  
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      width: `${MINIMAP_SIZE}px`,
      height: `${MINIMAP_SIZE}px`,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      border: '2px solid #4a7c59',
      borderRadius: '8px',
      overflow: 'hidden',
      zIndex: 100
    }}>
      {/* Trail */}
      <svg
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Draw trail as connected line */}
        {trail.length > 1 && (
          <polyline
            points={trail.map(p => {
              const mp = worldToMinimap(p.x, p.z)
              return `${mp.x},${mp.y}`
            }).join(' ')}
            fill="none"
            stroke="rgba(255, 200, 100, 0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* Exit marker */}
        <circle
          cx={exitPos.x}
          cy={exitPos.y}
          r="5"
          fill="#00ff88"
          style={{ filter: 'drop-shadow(0 0 3px #00ff88)' }}
        />
        
        {/* Player marker */}
        <circle
          cx={playerMapPos.x}
          cy={playerMapPos.y}
          r="4"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="1"
        />
      </svg>
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '4px',
        left: '4px',
        fontSize: '8px',
        color: '#aaa'
      }}>
        <span style={{ color: '#00ff88' }}>● </span>Exit
      </div>
    </div>
  )
}
