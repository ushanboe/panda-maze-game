
import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../stores/gameStore'

const CELL_SIZE = 2
const BALL_SPEED = 3.5 // Slightly slower than panda for fairness
const BALL_RADIUS = 0.9 // Almost as wide as path
const CATCH_DISTANCE = 1.2 // Distance to catch panda
const PATH_UPDATE_INTERVAL = 0.5 // Recalculate path every 0.5 seconds

// ============================================
// BFS PATHFINDING - Find shortest path through maze
// ============================================
function findPath(grid, startGrid, endGrid, width, height) {
  if (!grid || !startGrid || !endGrid) return []

  const start = { x: Math.round(startGrid.x), y: Math.round(startGrid.y) }
  const end = { x: Math.round(endGrid.x), y: Math.round(endGrid.y) }

  // Bounds check
  if (start.x < 0 || start.x >= width || start.y < 0 || start.y >= height) return []
  if (end.x < 0 || end.x >= width || end.y < 0 || end.y >= height) return []

  // BFS
  const queue = [{ ...start, path: [start] }]
  const visited = new Set()
  visited.add(`${start.x},${start.y}`)

  const directions = [
    { x: 0, y: -1 }, // up
    { x: 1, y: 0 },  // right
    { x: 0, y: 1 },  // down
    { x: -1, y: 0 }  // left
  ]

  while (queue.length > 0) {
    const current = queue.shift()

    // Found the target
    if (current.x === end.x && current.y === end.y) {
      return current.path
    }

    // Explore neighbors
    for (const dir of directions) {
      const nx = current.x + dir.x
      const ny = current.y + dir.y
      const key = `${nx},${ny}`

      // Check bounds and if walkable (0 = path)
      if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
          !visited.has(key) && grid[ny] && grid[ny][nx] === 0) {
        visited.add(key)
        queue.push({
          x: nx,
          y: ny,
          path: [...current.path, { x: nx, y: ny }]
        })
      }
    }
  }

  return [] // No path found
}

// Convert world position to grid position
function worldToGrid(worldX, worldZ, mazeData) {
  const offsetX = -(mazeData.width * CELL_SIZE) / 2
  const offsetZ = -(mazeData.height * CELL_SIZE) / 2

  return {
    x: Math.floor((worldX - offsetX) / CELL_SIZE),
    y: Math.floor((worldZ - offsetZ) / CELL_SIZE)
  }
}

// Convert grid position to world position
function gridToWorld(gridX, gridY, mazeData) {
  const offsetX = -(mazeData.width * CELL_SIZE) / 2
  const offsetZ = -(mazeData.height * CELL_SIZE) / 2

  return {
    x: gridX * CELL_SIZE + offsetX + CELL_SIZE / 2,
    z: gridY * CELL_SIZE + offsetZ + CELL_SIZE / 2
  }
}

// ============================================
// CHASING BALL COMPONENT
// ============================================
export function ChasingBall({ mazeData }) {
  const groupRef = useRef()
  const ballRef = useRef()
  const glowRef = useRef()

  const gameState = useGameStore((state) => state.gameState)
  const playerPosition = useGameStore((state) => state.playerPosition)
  const loseGame = useGameStore((state) => state.loseGame)

  // Ball state
  const [position, setPosition] = useState({ x: 0, z: 0 })
  const [path, setPath] = useState([])
  const [pathIndex, setPathIndex] = useState(0)
  const lastPathUpdate = useRef(0)
  const initialized = useRef(false)

  // Initialize ball position at exit
  useEffect(() => {
    if (mazeData && mazeData.exit && gameState === 'playing' && !initialized.current) {
      const exitWorld = gridToWorld(mazeData.exit.x, mazeData.exit.y, mazeData)
      setPosition({ x: exitWorld.x, z: exitWorld.z })
      setPath([])
      setPathIndex(0)
      initialized.current = true
    }

    if (gameState === 'menu') {
      initialized.current = false
    }
  }, [mazeData, gameState])

  // Main update loop
  useFrame((state, delta) => {
    if (gameState !== 'playing' || !mazeData || !groupRef.current) return

    const time = state.clock.elapsedTime

    // Update path periodically
    if (time - lastPathUpdate.current > PATH_UPDATE_INTERVAL) {
      lastPathUpdate.current = time

      const ballGrid = worldToGrid(position.x, position.z, mazeData)
      const playerGrid = worldToGrid(playerPosition.x, playerPosition.z, mazeData)

      const newPath = findPath(
        mazeData.grid,
        ballGrid,
        playerGrid,
        mazeData.width,
        mazeData.height
      )

      if (newPath.length > 1) {
        setPath(newPath)
        setPathIndex(1) // Start from index 1 (skip current position)
      }
    }

    // Move along path
    if (path.length > 0 && pathIndex < path.length) {
      const targetGrid = path[pathIndex]
      const targetWorld = gridToWorld(targetGrid.x, targetGrid.y, mazeData)

      const dx = targetWorld.x - position.x
      const dz = targetWorld.z - position.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < 0.2) {
        // Reached waypoint, move to next
        setPathIndex(pathIndex + 1)
      } else {
        // Move toward waypoint
        const moveSpeed = BALL_SPEED * delta
        const moveX = (dx / dist) * Math.min(moveSpeed, dist)
        const moveZ = (dz / dist) * Math.min(moveSpeed, dist)

        setPosition(prev => ({
          x: prev.x + moveX,
          z: prev.z + moveZ
        }))
      }
    }

    // Update visual position
    groupRef.current.position.x = position.x
    groupRef.current.position.z = position.z

    // Animate ball
    if (ballRef.current) {
      ballRef.current.rotation.x += delta * 3
      ballRef.current.rotation.z += delta * 2
    }

    // Pulse glow
    if (glowRef.current) {
      const pulse = 0.4 + Math.sin(time * 4) * 0.2
      glowRef.current.material.opacity = pulse
    }

    // Check collision with player
    const playerDx = playerPosition.x - position.x
    const playerDz = playerPosition.z - position.z
    const playerDist = Math.sqrt(playerDx * playerDx + playerDz * playerDz)

    if (playerDist < CATCH_DISTANCE) {
      // Caught the panda!
      loseGame()
    }
  })

  // Don't render if not playing
  if (gameState !== 'playing') return null

  return (
    <group ref={groupRef} position={[position.x, BALL_RADIUS, position.z]}>
      {/* Main ball - translucent blue */}
      <mesh ref={ballRef} castShadow>
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color="#0088ff"
          transparent
          opacity={0.7}
          metalness={0.3}
          roughness={0.2}
          emissive="#0044aa"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Inner glow core */}
      <mesh>
        <sphereGeometry args={[BALL_RADIUS * 0.6, 16, 16]} />
        <meshBasicMaterial
          color="#00aaff"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[BALL_RADIUS * 1.3, 16, 16]} />
        <meshBasicMaterial
          color="#0066ff"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Ground shadow/glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -BALL_RADIUS + 0.05, 0]}>
        <circleGeometry args={[BALL_RADIUS * 1.5, 32]} />
        <meshBasicMaterial
          color="#0066ff"
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Point light for eerie glow */}
      <pointLight
        color="#0088ff"
        intensity={1}
        distance={6}
      />
    </group>
  )
}
