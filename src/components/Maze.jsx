import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../stores/gameStore'
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

// Generate coin and treasure positions
function generateCollectibles(walls, exitPosition, mazeSize) {
  const wallSet = new Set(walls.map(w => `${w.x},${w.z}`))

  // Find all empty cells
  const emptyCells = []
  for (let x = -mazeSize; x <= mazeSize; x += CELL_SIZE) {
    for (let z = -mazeSize; z <= mazeSize; z += CELL_SIZE) {
      if (!wallSet.has(`${x},${z}`)) {
        const distFromStart = Math.hypot(x, z)
        const distFromExit = Math.hypot(x - exitPosition.x, z - exitPosition.z)
        // Don't place too close to start or exit
        if (distFromStart > CELL_SIZE * 2 && distFromExit > CELL_SIZE * 2) {
          emptyCells.push({ x, z, distFromExit })
        }
      }
    }
  }

  // Sort by distance from exit (furthest first)
  emptyCells.sort((a, b) => b.distFromExit - a.distFromExit)

  // 10K treasure at furthest point from exit
  const treasure10KPos = emptyCells.length > 0 
    ? { x: emptyCells[0].x, z: emptyCells[0].z }
    : { x: 0, z: 0 }

  // 50K treasure at center of maze (will appear when near exit)
  const treasure50KPos = { x: 0, z: 0 }

  // Generate coins - avoid treasure positions
  const usedPositions = new Set([
    `${treasure10KPos.x},${treasure10KPos.z}`,
    `${treasure50KPos.x},${treasure50KPos.z}`,
    '0,0' // Start position
  ])

  // Coin values and distribution
  const coinValues = [
    { value: 100, count: 4 },   // 4 bronze
    { value: 250, count: 3 },   // 3 silver
    { value: 500, count: 2 },   // 2 gold
    { value: 1000, count: 1 }   // 1 platinum
  ]

  const coins = []
  let coinId = 0

  // Shuffle empty cells for random placement
  const shuffledCells = emptyCells
    .filter(c => !usedPositions.has(`${c.x},${c.z}`))
    .sort(() => Math.random() - 0.5)

  let cellIndex = 0
  for (const { value, count } of coinValues) {
    for (let i = 0; i < count && cellIndex < shuffledCells.length; i++) {
      const cell = shuffledCells[cellIndex++]
      coins.push({
        id: coinId++,
        x: cell.x,
        z: cell.z,
        value,
        collected: false
      })
    }
  }

  return { coins, treasure10KPos, treasure50KPos }
}

export function Maze({ walls, exitPosition, mazeSize = 10 }) {
  const initializeCoins = useGameStore(state => state.initializeCoins)
  const setTreasurePositions = useGameStore(state => state.setTreasurePositions)
  const gameState = useGameStore(state => state.gameState)

  // Generate collectibles when game starts
  useEffect(() => {
    if (gameState === 'playing') {
      const { coins, treasure10KPos, treasure50KPos } = generateCollectibles(
        walls, 
        exitPosition, 
        mazeSize * CELL_SIZE
      )
      initializeCoins(coins)
      setTreasurePositions(treasure10KPos, treasure50KPos)
    }
  }, [gameState, walls, exitPosition, mazeSize])

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
