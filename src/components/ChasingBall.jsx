
import { useRef, useEffect } from 'react'
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
  if (!grid || !startGrid || !endGrid) return null

  const startX = Math.round(startGrid.x)
  const startY = Math.round(startGrid.y)
  const endX = Math.round(endGrid.x)
  const endY = Math.round(endGrid.y)

  // Bounds check
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return null
  if (endX < 0 || endX >= width || endY < 0 || endY >= height) return null

  // BFS with optimized memory usage
  const queue = []
  const visited = new Array(height)
  const parent = new Array(height)

  for (let i = 0; i < height; i++) {
    visited[i] = new Array(width).fill(false)
    parent[i] = new Array(width).fill(null)
  }

  queue.push({ x: startX, y: startY })
  visited[startY][startX] = true

  const directions = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 }
  ]

  let found = false
  while (queue.length > 0) {
    const current = queue.shift()

    if (current.x === endX && current.y === endY) {
      found = true
      break
    }

    for (const dir of directions) {
      const nx = current.x + dir.x
      const ny = current.y + dir.y

      if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
          !visited[ny][nx] && grid[ny] && grid[ny][nx] === 0) {
        visited[ny][nx] = true
        parent[ny][nx] = { x: current.x, y: current.y }
        queue.push({ x: nx, y: ny })
      }
    }
  }

  if (!found) return null

  // Reconstruct path
  const path = []
  let cx = endX, cy = endY
  while (cx !== startX || cy !== startY) {
    path.unshift({ x: cx, y: cy })
    const p = parent[cy][cx]
    if (!p) break
    cx = p.x
    cy = p.y
  }
  path.unshift({ x: startX, y: startY })

  return path
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
function gridToWorldPos(gridX, gridY, mazeData) {
  const offsetX = -(mazeData.width * CELL_SIZE) / 2
  const offsetZ = -(mazeData.height * CELL_SIZE) / 2

  return {
    x: gridX * CELL_SIZE + offsetX + CELL_SIZE / 2,
    z: gridY * CELL_SIZE + offsetZ + CELL_SIZE / 2
  }
}

// ============================================
// CHASING BALL COMPONENT - OPTIMIZED
// ============================================
export function ChasingBall({ mazeData }) {
  const groupRef = useRef()
  const ballRef = useRef()
  const glowRef = useRef()

  // Use refs instead of state for performance
  const positionRef = useRef({ x: 0, z: 0 })
  const pathRef = useRef(null)
  const pathIndexRef = useRef(0)
  const lastPathUpdateRef = useRef(0)
  const initializedRef = useRef(false)
  const isActiveRef = useRef(false)

  // Get loseGame function once (stable reference)
  const loseGame = useGameStore((state) => state.loseGame)

  // Initialize ball position at exit when game starts
  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      if (state.gameState === 'playing' && mazeData && mazeData.exit && !initializedRef.current) {
        const exitWorld = gridToWorldPos(mazeData.exit.x, mazeData.exit.y, mazeData)
        positionRef.current = { x: exitWorld.x, z: exitWorld.z }
        pathRef.current = null
        pathIndexRef.current = 0
        lastPathUpdateRef.current = 0
        initializedRef.current = true
        isActiveRef.current = true

        // Update visual position immediately
        if (groupRef.current) {
          groupRef.current.position.x = exitWorld.x
          groupRef.current.position.z = exitWorld.z
          groupRef.current.visible = true
        }
      }

      if (state.gameState === 'menu' || state.gameState === 'won' || state.gameState === 'lost') {
        initializedRef.current = false
        isActiveRef.current = false
        if (groupRef.current) {
          groupRef.current.visible = false
        }
      }
    })

    return () => unsubscribe()
  }, [mazeData])

  // Main update loop - no state updates, direct manipulation
  useFrame((state, delta) => {
    if (!isActiveRef.current || !mazeData || !groupRef.current) return

    // Check game state without subscribing
    const currentGameState = useGameStore.getState().gameState
    if (currentGameState !== 'playing') return

    const time = state.clock.elapsedTime
    const pos = positionRef.current

    // Update path periodically
    if (time - lastPathUpdateRef.current > PATH_UPDATE_INTERVAL) {
      lastPathUpdateRef.current = time

      // Get player position without subscription
      const playerPos = useGameStore.getState().playerPosition

      const ballGrid = worldToGrid(pos.x, pos.z, mazeData)
      const playerGrid = worldToGrid(playerPos.x, playerPos.z, mazeData)

      const newPath = findPath(
        mazeData.grid,
        ballGrid,
        playerGrid,
        mazeData.width,
        mazeData.height
      )

      if (newPath && newPath.length > 1) {
        pathRef.current = newPath
        pathIndexRef.current = 1
      }
    }

    // Move along path
    const path = pathRef.current
    const pathIndex = pathIndexRef.current

    if (path && pathIndex < path.length) {
      const targetGrid = path[pathIndex]
      const targetWorld = gridToWorldPos(targetGrid.x, targetGrid.y, mazeData)

      const dx = targetWorld.x - pos.x
      const dz = targetWorld.z - pos.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < 0.2) {
        // Reached waypoint, move to next
        pathIndexRef.current = pathIndex + 1
      } else {
        // Move toward waypoint
        const moveSpeed = BALL_SPEED * delta
        const moveAmount = Math.min(moveSpeed, dist)
        pos.x += (dx / dist) * moveAmount
        pos.z += (dz / dist) * moveAmount
      }
    }

    // Update visual position directly
    groupRef.current.position.x = pos.x
    groupRef.current.position.z = pos.z

    // Animate ball rotation
    if (ballRef.current) {
      ballRef.current.rotation.x += delta * 3
      ballRef.current.rotation.z += delta * 2
    }

    // Pulse glow
    if (glowRef.current && glowRef.current.material) {
      const pulse = 0.3 + Math.sin(time * 4) * 0.15
      glowRef.current.material.opacity = pulse
    }

    // Check collision with player
    const playerPos = useGameStore.getState().playerPosition
    const playerDx = playerPos.x - pos.x
    const playerDz = playerPos.z - pos.z
    const playerDist = Math.sqrt(playerDx * playerDx + playerDz * playerDz)

    if (playerDist < CATCH_DISTANCE) {
      // Caught the panda!
      isActiveRef.current = false
      loseGame()
    }
  })

  return (
    <group ref={groupRef} position={[0, BALL_RADIUS, 0]} visible={false}>
      {/* Main ball - translucent blue */}
      <mesh ref={ballRef} castShadow>
        <sphereGeometry args={[BALL_RADIUS, 24, 24]} />
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
        <sphereGeometry args={[BALL_RADIUS * 0.6, 12, 12]} />
        <meshBasicMaterial
          color="#00aaff"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[BALL_RADIUS * 1.3, 12, 12]} />
        <meshBasicMaterial
          color="#0066ff"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Ground shadow/glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -BALL_RADIUS + 0.05, 0]}>
        <circleGeometry args={[BALL_RADIUS * 1.5, 24]} />
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
