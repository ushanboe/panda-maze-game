
import { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../stores/gameStore'
import { gridToWorld } from '../utils/mazeGenerator'

const CELL_SIZE = 2
const WALL_HEIGHT = 3

// Simplified leaf - just a few per stalk for performance
function BambooLeaf({ position, rotation, scale = 1 }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <coneGeometry args={[0.12 * scale, 0.5 * scale, 3, 1]} />
      <meshStandardMaterial color="#228b22" flatShading={true} />
    </mesh>
  )
}

// Bamboo segment - THICKER but fewer parts for performance
function BambooSegment({ position, height = WALL_HEIGHT }) {
  const baseRadius = 0.22
  const topRadius = 0.18

  return (
    <group position={position}>
      {/* Main bamboo stalk - THICK */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[topRadius, baseRadius, height, 6]} />
        <meshStandardMaterial color="#7cb342" flatShading={true} />
      </mesh>

      {/* Just 2 rings for performance */}
      {[0.33, 0.66].map((t, i) => (
        <mesh key={i} position={[0, (t - 0.5) * height, 0]}>
          <torusGeometry args={[baseRadius + 0.02, 0.025, 4, 8]} />
          <meshStandardMaterial color="#558b2f" flatShading={true} />
        </mesh>
      ))}

      {/* Just 3 leaves at top for performance */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2
        return (
          <BambooLeaf
            key={i}
            position={[Math.sin(angle) * 0.1, height/2 - 0.2, Math.cos(angle) * 0.1]}
            rotation={[Math.PI/4, angle, 0]}
            scale={1}
          />
        )
      })}
    </group>
  )
}

// Wall with 3x3 THICK bamboo stalks - optimized
function BambooWall({ x, z }) {
  const bambooStalks = useMemo(() => {
    const stalks = []
    const count = 3
    const spacing = CELL_SIZE / count

    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const offsetX = (i - count / 2 + 0.5) * spacing
        const offsetZ = (j - count / 2 + 0.5) * spacing
        const randX = (Math.random() - 0.5) * 0.15
        const randZ = (Math.random() - 0.5) * 0.15
        const randHeight = WALL_HEIGHT + (Math.random() - 0.5) * 0.6

        stalks.push({
          position: [offsetX + randX, 0, offsetZ + randZ],
          height: randHeight
        })
      }
    }
    return stalks
  }, [])

  return (
    <group position={[x, WALL_HEIGHT / 2, z]}>
      {bambooStalks.map((stalk, index) => (
        <BambooSegment
          key={index}
          position={stalk.position}
          height={stalk.height}
        />
      ))}
    </group>
  )
}

// Generate coin and treasure positions using MAZE GRID
// UPDATED: Place chests on OPPOSITE SIDES of the maze for challenge
function generateCollectibles(mazeData) {
  // Safety check
  if (!mazeData || !mazeData.grid || !mazeData.start || !mazeData.exit) {
    console.warn('generateCollectibles: Invalid mazeData')
    return { coins: [], treasure10KPos: { x: 0, z: 0 }, treasure50KPos: { x: 0, z: 0 } }
  }

  const { grid, start, exit, width, height } = mazeData

  // Find all PATH cells - ONLY at odd coordinates (actual path cell centers)
  const pathCells = []
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      if (grid[y][x] === 0) {
        const distFromStart = Math.hypot(x - start.x, y - start.y)
        const distFromExit = Math.hypot(x - exit.x, y - exit.y)

        if (distFromStart > 0 && distFromExit > 0) {
          pathCells.push({
            gridX: x,
            gridY: y,
            distFromStart,
            distFromExit
          })
        }
      }
    }
  }

  console.log('🪙 Path cells found:', pathCells.length)

  if (pathCells.length === 0) {
    console.warn('No path cells found!')
    return { coins: [], treasure10KPos: { x: 0, z: 0 }, treasure50KPos: { x: 0, z: 0 } }
  }

  // ============================================
  // TREASURE PLACEMENT - OPPOSITE SIDES OF MAZE
  // 10K chest: Near the START but not too close (player must explore)
  // 50K chest: Near the EXIT but not too close (harder to get)
  // ============================================

  // Sort by distance from start (furthest first for 10K - make them explore)
  const sortedByStartDist = [...pathCells].sort((a, b) => b.distFromStart - a.distFromStart)

  // Sort by distance from exit (closest first for 50K - near exit but not at exit)
  const sortedByExitDist = [...pathCells].sort((a, b) => a.distFromExit - b.distFromExit)

  // 10K treasure: Find a cell that is FAR from start (opposite side)
  // but also reasonably far from exit (so it's in a different area)
  let treasure10KCell = null
  for (const cell of sortedByStartDist) {
    // Must be at least 8 grid units from start and 6 from exit
    if (cell.distFromStart >= 8 && cell.distFromExit >= 6) {
      treasure10KCell = cell
      break
    }
  }
  // Fallback: just use furthest from start
  if (!treasure10KCell) {
    treasure10KCell = sortedByStartDist[0]
  }

  // 50K treasure: Find a cell that is CLOSE to exit but not too close
  // and FAR from the 10K chest location
  let treasure50KCell = null
  for (const cell of sortedByExitDist) {
    const distFrom10K = Math.hypot(cell.gridX - treasure10KCell.gridX, cell.gridY - treasure10KCell.gridY)
    // Must be at least 3 units from exit (not right at exit)
    // and at least 10 units from 10K chest (opposite side)
    if (cell.distFromExit >= 3 && cell.distFromExit <= 10 && distFrom10K >= 10) {
      treasure50KCell = cell
      break
    }
  }
  // Fallback: find any cell far from 10K
  if (!treasure50KCell) {
    for (const cell of sortedByExitDist) {
      const distFrom10K = Math.hypot(cell.gridX - treasure10KCell.gridX, cell.gridY - treasure10KCell.gridY)
      if (distFrom10K >= 8) {
        treasure50KCell = cell
        break
      }
    }
  }
  // Final fallback
  if (!treasure50KCell) {
    treasure50KCell = sortedByExitDist[Math.min(5, sortedByExitDist.length - 1)]
  }

  const treasure10KWorld = gridToWorld(treasure10KCell.gridX, treasure10KCell.gridY, mazeData, CELL_SIZE)
  const treasure50KWorld = gridToWorld(treasure50KCell.gridX, treasure50KCell.gridY, mazeData, CELL_SIZE)

  const distBetweenChests = Math.hypot(
    treasure10KCell.gridX - treasure50KCell.gridX,
    treasure10KCell.gridY - treasure50KCell.gridY
  )

  console.log('📦 Treasure positions (OPPOSITE SIDES):', {
    '10K': { world: treasure10KWorld, distFromStart: treasure10KCell.distFromStart.toFixed(1) },
    '50K': { world: treasure50KWorld, distFromExit: treasure50KCell.distFromExit.toFixed(1) },
    'distBetweenChests': distBetweenChests.toFixed(1)
  })

  // Remove used positions
  const usedGridKeys = new Set([
    `${treasure10KCell.gridX},${treasure10KCell.gridY}`,
    `${treasure50KCell.gridX},${treasure50KCell.gridY}`
  ])

  const availableCells = pathCells.filter(c => !usedGridKeys.has(`${c.gridX},${c.gridY}`))
  const shuffledCells = availableCells.sort(() => Math.random() - 0.5)

  // Coin values and distribution
  const coinValues = [
    { value: 100, count: 4 },
    { value: 250, count: 3 },
    { value: 500, count: 2 },
    { value: 1000, count: 1 }
  ]

  const coins = []
  let coinId = 0
  let cellIndex = 0

  for (const { value, count } of coinValues) {
    for (let i = 0; i < count && cellIndex < shuffledCells.length; i++) {
      const cell = shuffledCells[cellIndex++]
      const worldPos = gridToWorld(cell.gridX, cell.gridY, mazeData, CELL_SIZE)
      coins.push({
        id: coinId++,
        x: worldPos.x,
        z: worldPos.z,
        value,
        collected: false
      })
    }
  }

  console.log('🪙 Generated coins:', coins.length)

  return {
    coins,
    treasure10KPos: treasure10KWorld,
    treasure50KPos: treasure50KWorld
  }
}

export function Maze({ walls, exitPosition, mazeData }) {
  const initializeCoins = useGameStore(state => state.initializeCoins)
  const setTreasurePositions = useGameStore(state => state.setTreasurePositions)
  const gameState = useGameStore(state => state.gameState)

  // Track if we've generated collectibles for this maze
  const generatedForMaze = useRef(null)

  // Generate collectibles when mazeData changes AND game is playing
  useEffect(() => {
    // Only generate if playing and we have valid mazeData
    if (gameState !== 'playing' || !mazeData || !mazeData.grid) {
      return
    }

    // Create a unique key for this maze to prevent duplicate generation
    const mazeKey = `${mazeData.start?.x}-${mazeData.start?.y}-${mazeData.exit?.x}-${mazeData.exit?.y}`

    // Skip if we already generated for this exact maze
    if (generatedForMaze.current === mazeKey) {
      console.log('⏭️ Skipping collectibles generation - already done for this maze')
      return
    }

    console.log('🎮 Generating collectibles for new maze:', mazeKey)
    generatedForMaze.current = mazeKey

    const { coins, treasure10KPos, treasure50KPos } = generateCollectibles(mazeData)
    initializeCoins(coins)
    setTreasurePositions(treasure10KPos, treasure50KPos)

    console.log('✅ Collectibles initialized!')
  }, [gameState, mazeData, initializeCoins, setTreasurePositions])

  // Reset the generation flag when game ends
  useEffect(() => {
    if (gameState !== 'playing') {
      generatedForMaze.current = null
    }
  }, [gameState])

  // Safety check for exitPosition
  const safeExitPosition = exitPosition || { x: 0, z: 0 }

  return (
    <group>
      {/* Render all walls */}
      {walls.map((wall, index) => (
        <BambooWall
          key={index}
          x={wall.x}
          z={wall.z}
        />
      ))}

      {/* Exit marker - glowing green portal */}
      <group position={[safeExitPosition.x, 0, safeExitPosition.z]}>
        <mesh position={[0, 1.5, 0]}>
          <torusGeometry args={[1, 0.1, 8, 16]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={0.5}
          />
        </mesh>
        <pointLight
          position={[0, 1.5, 0]}
          color="#00ff88"
          intensity={2}
          distance={5}
        />
      </group>
    </group>
  )
}
