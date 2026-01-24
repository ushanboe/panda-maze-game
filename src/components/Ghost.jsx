import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'

const CELL_SIZE = 2

// Convert world position to grid position
function worldToGrid(worldX, worldZ, mazeData) {
  const offsetX = -(mazeData.width * CELL_SIZE) / 2
  const offsetZ = -(mazeData.height * CELL_SIZE) / 2
  return {
    x: Math.round((worldX - offsetX - CELL_SIZE / 2) / CELL_SIZE),
    z: Math.round((worldZ - offsetZ - CELL_SIZE / 2) / CELL_SIZE)
  }
}

// Convert grid position to world position
function gridToWorld(gridX, gridZ, mazeData) {
  const offsetX = -(mazeData.width * CELL_SIZE) / 2
  const offsetZ = -(mazeData.height * CELL_SIZE) / 2
  return {
    x: gridX * CELL_SIZE + offsetX + CELL_SIZE / 2,
    z: gridZ * CELL_SIZE + offsetZ + CELL_SIZE / 2
  }
}

// BFS pathfinding to find path from ghost to player (in grid coordinates)
function findPath(grid, startGrid, endGrid) {
  if (!grid || !grid.length || !grid[0]) return []

  const rows = grid.length
  const cols = grid[0].length

  const start = {
    x: Math.max(0, Math.min(cols - 1, startGrid.x)),
    z: Math.max(0, Math.min(rows - 1, startGrid.z))
  }
  const end = {
    x: Math.max(0, Math.min(cols - 1, endGrid.x)),
    z: Math.max(0, Math.min(rows - 1, endGrid.z))
  }

  const queue = [{ ...start, path: [] }]
  const visited = new Set()
  visited.add(`${start.x},${start.z}`)

  const directions = [
    { dx: 0, dz: -1 },
    { dx: 0, dz: 1 },
    { dx: -1, dz: 0 },
    { dx: 1, dz: 0 }
  ]

  while (queue.length > 0) {
    const current = queue.shift()

    if (current.x === end.x && current.z === end.z) {
      return current.path
    }

    for (const dir of directions) {
      const nx = current.x + dir.dx
      const nz = current.z + dir.dz
      const key = `${nx},${nz}`

      if (nx >= 0 && nx < cols && nz >= 0 && nz < rows &&
          !visited.has(key) && grid[nz] && grid[nz][nx] === 0) {
        visited.add(key)
        queue.push({
          x: nx,
          z: nz,
          path: [...current.path, { x: nx, z: nz }]
        })
      }
    }
  }

  return []
}

export function Ghost({ mazeData, walls, onCatchPlayer }) {
  const groupRef = useRef()
  
  // Use refs instead of state for position (avoids re-renders every frame)
  const ghostPosRef = useRef({ x: 0, z: 0 })
  const targetPosRef = useRef(null)
  const pathRef = useRef([])
  const opacityRef = useRef(0)
  const hasCaughtRef = useRef(false)
  
  const [initialized, setInitialized] = useState(false)
  const [opacity, setOpacity] = useState(0) // Only for initial fade-in

  const playerPosition = useGameStore(state => state.playerPosition)
  const gameState = useGameStore(state => state.gameState)
  const playerCaught = useGameStore(state => state.playerCaught)

  const GHOST_SPEED = 2.5
  const CATCH_DISTANCE = 1.5
  const PATH_UPDATE_INTERVAL = 500 // ms
  const lastPathUpdateRef = useRef(0)

  // Initialize ghost position
  useEffect(() => {
    if (mazeData && mazeData.grid && mazeData.grid.length > 0 && !initialized) {
      const startGridX = mazeData.grid[0].length - 2
      const startGridZ = mazeData.grid.length - 2

      let validX = startGridX
      let validZ = startGridZ

      if (mazeData.grid[validZ] && mazeData.grid[validZ][validX] === 1) {
        for (let dz = 0; dz < 5; dz++) {
          for (let dx = 0; dx < 5; dx++) {
            const testX = startGridX - dx
            const testZ = startGridZ - dz
            if (testX > 0 && testZ > 0 &&
                mazeData.grid[testZ] && mazeData.grid[testZ][testX] === 0) {
              validX = testX
              validZ = testZ
              break
            }
          }
        }
      }

      const worldPos = gridToWorld(validX, validZ, mazeData)
      ghostPosRef.current = worldPos
      setInitialized(true)
      hasCaughtRef.current = false
    }
  }, [mazeData, initialized])

  // Fade in ghost
  useEffect(() => {
    if (gameState === 'playing' && initialized) {
      const fadeIn = setInterval(() => {
        setOpacity(prev => {
          const newVal = prev + 0.05
          opacityRef.current = Math.min(newVal, 0.7)
          if (newVal >= 0.7) {
            clearInterval(fadeIn)
            return 0.7
          }
          return newVal
        })
      }, 100)
      return () => clearInterval(fadeIn)
    }
  }, [gameState, initialized])

  // Movement and animation loop - optimized
  useFrame((state, delta) => {
    if (gameState !== 'playing' || playerCaught || !initialized) return
    if (!groupRef.current) return

    const now = state.clock.elapsedTime * 1000
    
    // Update pathfinding less frequently (every 500ms instead of every frame)
    if (now - lastPathUpdateRef.current > PATH_UPDATE_INTERVAL && playerPosition && mazeData) {
      lastPathUpdateRef.current = now
      
      const ghostGrid = worldToGrid(ghostPosRef.current.x, ghostPosRef.current.z, mazeData)
      const playerGrid = worldToGrid(playerPosition.x, playerPosition.z, mazeData)
      
      const newPath = findPath(mazeData.grid, ghostGrid, playerGrid)
      pathRef.current = newPath
      
      if (newPath.length > 0) {
        targetPosRef.current = gridToWorld(newPath[0].x, newPath[0].z, mazeData)
      }
    }

    // Move towards target
    if (targetPosRef.current) {
      const dx = targetPosRef.current.x - ghostPosRef.current.x
      const dz = targetPosRef.current.z - ghostPosRef.current.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist > 0.1) {
        const moveX = (dx / dist) * GHOST_SPEED * delta
        const moveZ = (dz / dist) * GHOST_SPEED * delta

        ghostPosRef.current.x += moveX
        ghostPosRef.current.z += moveZ

        // Rotate to face movement direction
        const angle = Math.atan2(dx, dz)
        groupRef.current.rotation.y = angle
      } else {
        // Reached target, get next point in path
        if (pathRef.current.length > 1) {
          pathRef.current = pathRef.current.slice(1)
          if (pathRef.current.length > 0 && mazeData) {
            targetPosRef.current = gridToWorld(pathRef.current[0].x, pathRef.current[0].z, mazeData)
          }
        }
      }
    }

    // Check if caught player
    if (playerPosition && !hasCaughtRef.current) {
      const distToPlayer = Math.sqrt(
        Math.pow(ghostPosRef.current.x - playerPosition.x, 2) +
        Math.pow(ghostPosRef.current.z - playerPosition.z, 2)
      )

      if (distToPlayer < CATCH_DISTANCE) {
        hasCaughtRef.current = true
        if (onCatchPlayer) {
          onCatchPlayer()
        }
      }
    }

    // Update visual position directly (no state updates)
    groupRef.current.position.x = ghostPosRef.current.x
    groupRef.current.position.z = ghostPosRef.current.z
    groupRef.current.position.y = 1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3
  })

  if (!initialized) return null

  const s = 2.55

  return (
    <group ref={groupRef} position={[ghostPosRef.current.x, 1.5, ghostPosRef.current.z]} scale={[s, s, s]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
        <meshStandardMaterial
          color="#8844ff"
          transparent
          opacity={opacity}
          emissive="#4422aa"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <coneGeometry args={[0.35, 0.3, 8]} />
        <meshStandardMaterial
          color="#8844ff"
          transparent
          opacity={opacity}
          emissive="#4422aa"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[-0.12, 0.15, 0.25]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.12, 0.15, 0.25]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-0.12, 0.15, 0.34]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.12, 0.15, 0.34]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <pointLight color="#8844ff" intensity={0.8} distance={6} />
    </group>
  )
}
