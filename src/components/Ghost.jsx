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

  // Clamp to maze bounds
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
    { dx: 0, dz: -1 }, // up
    { dx: 0, dz: 1 },  // down
    { dx: -1, dz: 0 }, // left
    { dx: 1, dz: 0 }   // right
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

  return [] // No path found
}

export function Ghost({ mazeData, walls, onCatchPlayer }) {
  const groupRef = useRef()

  // Ghost state - stored in WORLD coordinates
  const [ghostWorldPos, setGhostWorldPos] = useState({ x: 0, z: 0 })
  const [targetWorldPos, setTargetWorldPos] = useState(null)
  const [path, setPath] = useState([]) // Path in grid coordinates
  const [opacity, setOpacity] = useState(0)
  const [initialized, setInitialized] = useState(false)
  const [hasCaught, setHasCaught] = useState(false)

  // Get player position and game state from store
  const playerPosition = useGameStore(state => state.playerPosition)
  const gameState = useGameStore(state => state.gameState)
  const playerCaught = useGameStore(state => state.playerCaught)

  const GHOST_SPEED = 2.5
  const CATCH_DISTANCE = 1.5 // Increased for larger models

  // Initialize ghost position (opposite corner from player start)
  useEffect(() => {
    if (mazeData && mazeData.grid && mazeData.grid.length > 0 && !initialized) {
      // Start ghost at opposite corner from player start
      const startGridX = mazeData.grid[0].length - 2
      const startGridZ = mazeData.grid.length - 2

      // Make sure it's a valid path cell
      let validX = startGridX
      let validZ = startGridZ

      // Find nearest valid cell if starting position is a wall
      if (mazeData.grid[validZ] && mazeData.grid[validZ][validX] === 1) {
        // Search for nearby valid cell
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
      setGhostWorldPos(worldPos)
      setInitialized(true)
      setHasCaught(false)
    }
  }, [mazeData, initialized])

  // Fade in ghost
  useEffect(() => {
    if (gameState === 'playing' && initialized) {
      const fadeIn = setInterval(() => {
        setOpacity(prev => {
          if (prev >= 0.7) {
            clearInterval(fadeIn)
            return 0.7
          }
          return prev + 0.05
        })
      }, 100)
      return () => clearInterval(fadeIn)
    }
  }, [gameState, initialized])

  // Pathfinding - update path periodically
  useEffect(() => {
    if (!mazeData || !mazeData.grid || !playerPosition || gameState !== 'playing' || playerCaught || !initialized) return

    const updatePath = () => {
      // Convert positions to grid coordinates
      const ghostGrid = worldToGrid(ghostWorldPos.x, ghostWorldPos.z, mazeData)
      const playerGrid = worldToGrid(playerPosition.x, playerPosition.z, mazeData)

      const newPath = findPath(mazeData.grid, ghostGrid, playerGrid)
      setPath(newPath)

      if (newPath.length > 0) {
        // Convert first path point to world coordinates
        const targetWorld = gridToWorld(newPath[0].x, newPath[0].z, mazeData)
        setTargetWorldPos(targetWorld)
      }
    }

    updatePath()
    const interval = setInterval(updatePath, 500) // Update path every 500ms

    return () => clearInterval(interval)
  }, [mazeData, playerPosition, ghostWorldPos, gameState, playerCaught, initialized])

  // Movement and animation loop
  useFrame((state, delta) => {
    if (gameState !== 'playing' || playerCaught || !initialized) return
    if (!groupRef.current) return

    // Move towards target
    if (targetWorldPos) {
      const dx = targetWorldPos.x - ghostWorldPos.x
      const dz = targetWorldPos.z - ghostWorldPos.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist > 0.1) {
        const moveX = (dx / dist) * GHOST_SPEED * delta
        const moveZ = (dz / dist) * GHOST_SPEED * delta

        setGhostWorldPos(prev => ({
          x: prev.x + moveX,
          z: prev.z + moveZ
        }))

        // Rotate to face movement direction
        const angle = Math.atan2(dx, dz)
        groupRef.current.rotation.y = angle
      } else {
        // Reached target, get next point in path
        if (path.length > 1) {
          const nextPath = path.slice(1)
          setPath(nextPath)
          if (nextPath.length > 0 && mazeData) {
            const nextWorld = gridToWorld(nextPath[0].x, nextPath[0].z, mazeData)
            setTargetWorldPos(nextWorld)
          }
        }
      }
    }

    // Check if caught player
    if (playerPosition && !hasCaught) {
      const distToPlayer = Math.sqrt(
        Math.pow(ghostWorldPos.x - playerPosition.x, 2) +
        Math.pow(ghostWorldPos.z - playerPosition.z, 2)
      )

      if (distToPlayer < CATCH_DISTANCE) {
        setHasCaught(true)
        if (onCatchPlayer) {
          onCatchPlayer()
        }
      }
    }

    // Update position and floating animation
    groupRef.current.position.x = ghostWorldPos.x
    groupRef.current.position.z = ghostWorldPos.z
    groupRef.current.position.y = 1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3
  })

  // Don't render until initialized
  if (!initialized) return null

  // Scale factor - 3x bigger than before
  const s = 2.55

  return (
    <group ref={groupRef} position={[ghostWorldPos.x, 1.5, ghostWorldPos.z]} scale={[s, s, s]}>
      {/* Ghost body - translucent capsule */}
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
      {/* Wavy bottom */}
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
      {/* Eyes */}
      <mesh position={[-0.12, 0.15, 0.25]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.12, 0.15, 0.25]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.12, 0.15, 0.34]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.12, 0.15, 0.34]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Glow effect */}
      <pointLight color="#8844ff" intensity={0.8} distance={6} />
    </group>
  )
}
