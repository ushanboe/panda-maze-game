import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../stores/gameStore'
import { gridToWorld } from '../utils/mazeGenerator'
import { Coins } from './Coin'
import { TreasureChest } from './TreasureChest'

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

// Convert grid coordinates to world coordinates (same as Player.jsx)
// gridToWorld imported from mazeGenerator for consistency

// Generate coin and treasure positions using MAZE GRID
function generateCollectibles(mazeData) {
  const { grid, start, exit, width, height } = mazeData

  // Find all PATH cells - ONLY at odd coordinates (actual path cell centers)
  // The maze uses odd coords for path centers, even coords for walls/connectors
  const pathCells = []
  for (let y = 1; y < height - 1; y += 2) {  // Only odd y values
    for (let x = 1; x < width - 1; x += 2) {  // Only odd x values
      if (grid[y][x] === 0) {
        // Calculate distance from start and exit in grid coords
        const distFromStart = Math.hypot(x - start.x, y - start.y)
        const distFromExit = Math.hypot(x - exit.x, y - exit.y)

        // Don't place ON start or exit (allow nearby cells)
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

  // Sort by distance from exit (furthest first)
  const sortedByExitDist = [...pathCells].sort((a, b) => b.distFromExit - a.distFromExit)

  // 50K treasure at THE FURTHEST point from exit (biggest reward for exploration)
  const treasure50KCell = sortedByExitDist.length > 0 ? sortedByExitDist[0] : { gridX: start.x, gridY: start.y }
  const treasure50KWorld = gridToWorld(treasure50KCell.gridX, treasure50KCell.gridY, mazeData, CELL_SIZE)

  // 10K treasure at SECOND furthest point from exit
  const treasure10KCell = sortedByExitDist.length > 1 ? sortedByExitDist[1] : sortedByExitDist[0] || { gridX: start.x, gridY: start.y }
  const treasure10KWorld = gridToWorld(treasure10KCell.gridX, treasure10KCell.gridY, mazeData, CELL_SIZE)

  // Remove used positions from available cells
  const usedGridKeys = new Set([
    `${treasure10KCell.gridX},${treasure10KCell.gridY}`,
    `${treasure50KCell.gridX},${treasure50KCell.gridY}`
  ])

  const availableCells = pathCells.filter(c => !usedGridKeys.has(`${c.gridX},${c.gridY}`))

  // Shuffle for random coin placement
  const shuffledCells = availableCells.sort(() => Math.random() - 0.5)

  // Coin values and distribution
  const coinValues = [
    { value: 100, count: 4 },   // 4 bronze
    { value: 250, count: 3 },   // 3 silver
    { value: 500, count: 2 },   // 2 gold
    { value: 1000, count: 1 }   // 1 platinum
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

  console.log('Generated collectibles:', {
    coins: coins.length,
    treasure10K: treasure10KWorld,
    treasure50K: treasure50KWorld,
    pathCellsFound: pathCells.length,
    exitPos: gridToWorld(exit.x, exit.y, mazeData, CELL_SIZE)
  })

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

  // Generate collectibles when game starts
  useEffect(() => {
    if (gameState === 'playing' && mazeData) {
      const { coins, treasure10KPos, treasure50KPos } = generateCollectibles(mazeData)
      initializeCoins(coins)
      setTreasurePositions(treasure10KPos, treasure50KPos)
    }
  }, [gameState, mazeData])

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
      <group position={[exitPosition.x, 0, exitPosition.z]}>
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

      {/* Collectibles */}
      {gameState === 'playing' && (
        <>
          <Coins />
          <TreasureChest type="10K" />
          <TreasureChest type="50K" />
        </>
      )}
    </group>
  )
}
