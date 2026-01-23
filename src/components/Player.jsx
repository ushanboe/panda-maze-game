import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import { AnimatedPanda } from './AnimatedPanda'
import { SoundManager } from '../utils/SoundManager'
import * as THREE from 'three'

// PAC-MAN STYLE: Tap direction = turn + move until wall
const CELL_SIZE = 2
const MOVE_SPEED = 6
const PLAYER_RADIUS = 0.4
const COLLECT_RADIUS = 1.2 // Radius for collecting items

export function Player({ mazeData, walls, onReachExit, onDirectionRef }) {
  const groupRef = useRef()
  const { camera } = useThree()
  const [isMoving, setIsMoving] = useState(false)
  const [hasWon, setHasWon] = useState(false)

  // Movement state
  const currentPosRef = useRef({ x: 0, z: 0 })
  const targetPosRef = useRef({ x: 0, z: 0 })
  const directionRef = useRef(-1) // -1=stopped, 0=up, 1=right, 2=down, 3=left
  const isMovingRef = useRef(false)
  const lastBumpTime = useRef(0)

  const gameState = useGameStore(state => state.gameState)
  const updatePlayerPosition = useGameStore(state => state.updatePlayerPosition)

  // Collectibles
  const coins = useGameStore(state => state.coins)
  const treasure10K = useGameStore(state => state.treasure10K)
  const treasure50K = useGameStore(state => state.treasure50K)
  const collectCoin = useGameStore(state => state.collectCoin)
  const collectTreasure10K = useGameStore(state => state.collectTreasure10K)
  const collectTreasure50K = useGameStore(state => state.collectTreasure50K)
  const setNearExit = useGameStore(state => state.setNearExit)

  // Calculate start and exit positions
  const startPos = {
    x: (mazeData.start.x - mazeData.width / 2) * CELL_SIZE + CELL_SIZE / 2,
    z: (mazeData.start.y - mazeData.height / 2) * CELL_SIZE + CELL_SIZE / 2
  }

  const exitPos = {
    x: (mazeData.exit.x - mazeData.width / 2) * CELL_SIZE + CELL_SIZE / 2,
    z: (mazeData.exit.y - mazeData.height / 2) * CELL_SIZE + CELL_SIZE / 2
  }

  // Initialize sound manager
  useEffect(() => {
    SoundManager.init()
  }, [])

  // Check collision with walls at a specific position
  const checkCollision = (x, z) => {
    for (const wall of walls) {
      const dx = Math.abs(x - wall.x)
      const dz = Math.abs(z - wall.z)
      if (dx < (CELL_SIZE / 2 + PLAYER_RADIUS) && dz < (CELL_SIZE / 2 + PLAYER_RADIUS)) {
        return true
      }
    }
    return false
  }

  // Check and collect items at position
  const checkCollectibles = (x, z) => {
    // Check coins
    for (const coin of coins) {
      if (coin.collected) continue
      const dist = Math.hypot(x - coin.x, z - coin.z)
      if (dist < COLLECT_RADIUS) {
        const value = collectCoin(coin.id)
        if (value) {
          SoundManager.coinCollect(value)
        }
      }
    }

    // Check 10K treasure
    if (!treasure10K.collected) {
      const dist10K = Math.hypot(x - treasure10K.x, z - treasure10K.z)
      if (dist10K < COLLECT_RADIUS) {
        if (collectTreasure10K()) {
          SoundManager.treasureChest10K()
        }
      }
    }

    // Check 50K treasure
    if (!treasure50K.collected) {  // 50K now always visible at furthest point
      const dist50K = Math.hypot(x - treasure50K.x, z - treasure50K.z)
      if (dist50K < COLLECT_RADIUS) {
        if (collectTreasure50K()) {
          SoundManager.treasureChest50K()
        }
      }
    }

    // 50K treasure is now at furthest point from exit, always visible from start
    // No proximity trigger needed
  }

  // Get next cell position in a direction
  const getNextCell = (x, z, direction) => {
    switch(direction) {
      case 0: return { x, z: z - CELL_SIZE } // Up (W) - negative Z
      case 1: return { x: x + CELL_SIZE, z } // Right (D) - positive X
      case 2: return { x, z: z + CELL_SIZE } // Down (S) - positive Z
      case 3: return { x: x - CELL_SIZE, z } // Left (A) - negative X
      default: return { x, z }
    }
  }

  // Get rotation for direction
  const getRotationForDirection = (direction) => {
    switch(direction) {
      case 0: return Math.PI     // Up - face away from camera
      case 1: return Math.PI/2  // Right
      case 2: return 0           // Down - face camera
      case 3: return -Math.PI/2   // Left
      default: return 0
    }
  }

  // Play bump sound with cooldown
  const playBumpSound = () => {
    const now = Date.now()
    if (now - lastBumpTime.current > 300) {
      SoundManager.wallBump()
      lastBumpTime.current = now
    }
  }

  // Set direction and start moving
  const setDirection = (direction) => {
    // Always update direction (turn the panda)
    directionRef.current = direction

    // Check if we can move in this direction
    const current = currentPosRef.current
    const next = getNextCell(current.x, current.z, direction)

    if (!checkCollision(next.x, next.z)) {
      // Can move - set target and start moving
      targetPosRef.current = next
      isMovingRef.current = true
      setIsMoving(true)
    } else {
      // Hit wall immediately - play bump sound
      playBumpSound()
    }
  }

  // Expose setDirection to parent via ref callback
  useEffect(() => {
    if (onDirectionRef) {
      onDirectionRef.current = setDirection
    }
  }, [onDirectionRef, walls])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return
      if (e.repeat) return

      switch(e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setDirection(0)
          break
        case 'KeyD':
        case 'ArrowRight':
          setDirection(1)
          break
        case 'KeyS':
        case 'ArrowDown':
          setDirection(2)
          break
        case 'KeyA':
        case 'ArrowLeft':
          setDirection(3)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, walls])

  // Initialize position
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(startPos.x, 0, startPos.z)
      groupRef.current.rotation.y = 0
      currentPosRef.current = { x: startPos.x, z: startPos.z }
      targetPosRef.current = { x: startPos.x, z: startPos.z }
      directionRef.current = -1
      isMovingRef.current = false
      updatePlayerPosition(startPos.x, startPos.z, 0)
    }
    setHasWon(false)
  }, [mazeData])

  // Check if reached exit
  const checkExit = (x, z) => {
    const dx = Math.abs(x - exitPos.x)
    const dz = Math.abs(z - exitPos.z)
    return dx < CELL_SIZE && dz < CELL_SIZE
  }

  useFrame((state, delta) => {
    if (!groupRef.current || gameState !== 'playing') return

    const pos = groupRef.current.position
    const target = targetPosRef.current
    const direction = directionRef.current

    // Rotate panda to face current direction (smooth rotation)
    if (direction >= 0) {
      const targetRotation = getRotationForDirection(direction)
      let rotDiff = targetRotation - groupRef.current.rotation.y
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2
      groupRef.current.rotation.y += rotDiff * 0.25
    }

    // Check collectibles at current position
    checkCollectibles(pos.x, pos.z)

    if (isMovingRef.current) {
      // Move towards target
      const dx = target.x - pos.x
      const dz = target.z - pos.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < 0.1) {
        // Reached target cell - snap to grid
        pos.x = target.x
        pos.z = target.z
        currentPosRef.current = { x: target.x, z: target.z }

        // Check win condition
        if (checkExit(pos.x, pos.z) && !hasWon) {
          setHasWon(true)
          isMovingRef.current = false
          setIsMoving(false)
          directionRef.current = -1
          SoundManager.gameWin()
          onReachExit()
          return
        }

        // Try to continue in same direction (Pac-Man style)
        const next = getNextCell(pos.x, pos.z, direction)
        if (!checkCollision(next.x, next.z)) {
          // Can continue - set new target
          targetPosRef.current = next
        } else {
          // Hit a wall - stop and play bump sound
          isMovingRef.current = false
          setIsMoving(false)
          playBumpSound()
        }
      } else {
        // Move towards target
        const moveAmount = MOVE_SPEED * delta
        pos.x += (dx / dist) * Math.min(moveAmount, dist)
        pos.z += (dz / dist) * Math.min(moveAmount, dist)
      }

      updatePlayerPosition(pos.x, pos.z, groupRef.current.rotation.y)
    }

    // Camera follows player - fixed angle from behind/above
    const cameraDistance = 12
    const cameraHeight = 10

    const targetCameraPos = new THREE.Vector3(
      pos.x,
      pos.y + cameraHeight,
      pos.z + cameraDistance
    )

    camera.position.lerp(targetCameraPos, 0.08)
    camera.lookAt(pos.x, pos.y, pos.z)
  })

  return (
    <group ref={groupRef} position={[startPos.x, 0, startPos.z]}>
      <AnimatedPanda isMoving={isMoving} hasWon={hasWon} scale={0.02} />
    </group>
  )
}
