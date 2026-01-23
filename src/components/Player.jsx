import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import { AnimatedPanda } from './AnimatedPanda'
import * as THREE from 'three'

// PAC-MAN STYLE GRID MOVEMENT
const CELL_SIZE = 2
const MOVE_SPEED = 8 // Fast snappy movement
const PLAYER_RADIUS = 0.4

export function Player({ mazeData, walls, onReachExit }) {
  const groupRef = useRef()
  const { camera } = useThree()
  const [isMoving, setIsMoving] = useState(false)
  const [hasWon, setHasWon] = useState(false)
  
  // Grid-based movement state
  const currentPosRef = useRef({ x: 0, z: 0 }) // Current position
  const targetPosRef = useRef({ x: 0, z: 0 })  // Target position (one cell away)
  const isMovingRef = useRef(false) // Are we currently moving to target?
  const directionRef = useRef(0) // 0=up, 1=right, 2=down, 3=left
  const queuedDirectionRef = useRef(-1) // Queued direction for next move
  
  const gameState = useGameStore(state => state.gameState)
  const updatePlayerPosition = useGameStore(state => state.updatePlayerPosition)
  
  // Calculate start and exit positions
  const startPos = {
    x: (mazeData.start.x - mazeData.width / 2) * CELL_SIZE + CELL_SIZE / 2,
    z: (mazeData.start.y - mazeData.height / 2) * CELL_SIZE + CELL_SIZE / 2
  }
  
  const exitPos = {
    x: (mazeData.exit.x - mazeData.width / 2) * CELL_SIZE + CELL_SIZE / 2,
    z: (mazeData.exit.y - mazeData.height / 2) * CELL_SIZE + CELL_SIZE / 2
  }
  
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
  
  // Try to move in a direction (0=up/forward, 1=right, 2=down/back, 3=left)
  const tryMove = (direction) => {
    if (isMovingRef.current) {
      // Queue this direction for when current move finishes
      queuedDirectionRef.current = direction
      return
    }
    
    const current = currentPosRef.current
    let targetX = current.x
    let targetZ = current.z
    
    // Calculate target based on direction
    switch(direction) {
      case 0: targetZ -= CELL_SIZE; break // Up (W) - negative Z
      case 1: targetX += CELL_SIZE; break // Right (D) - positive X
      case 2: targetZ += CELL_SIZE; break // Down (S) - positive Z
      case 3: targetX -= CELL_SIZE; break // Left (A) - negative X
    }
    
    // Check if target is valid (no wall)
    if (!checkCollision(targetX, targetZ)) {
      targetPosRef.current = { x: targetX, z: targetZ }
      directionRef.current = direction
      isMovingRef.current = true
      setIsMoving(true)
    }
  }
  
  // Handle keyboard input - PAC-MAN STYLE (single press = one cell move)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return
      if (e.repeat) return // Ignore key repeat for snappy control
      
      switch(e.code) {
        case 'KeyW':
        case 'ArrowUp':
          tryMove(0) // Up
          break
        case 'KeyD':
        case 'ArrowRight':
          tryMove(1) // Right
          break
        case 'KeyS':
        case 'ArrowDown':
          tryMove(2) // Down
          break
        case 'KeyA':
        case 'ArrowLeft':
          tryMove(3) // Left
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
    const current = currentPosRef.current
    
    if (isMovingRef.current) {
      // Move towards target
      const dx = target.x - pos.x
      const dz = target.z - pos.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      
      if (dist < 0.1) {
        // Reached target - snap to grid
        pos.x = target.x
        pos.z = target.z
        currentPosRef.current = { x: target.x, z: target.z }
        isMovingRef.current = false
        setIsMoving(false)
        
        // Check for queued direction
        if (queuedDirectionRef.current >= 0) {
          const queued = queuedDirectionRef.current
          queuedDirectionRef.current = -1
          tryMove(queued)
        }
        
        // Check win
        if (checkExit(pos.x, pos.z) && !hasWon) {
          setHasWon(true)
          onReachExit()
        }
      } else {
        // Move towards target
        const moveAmount = MOVE_SPEED * delta
        pos.x += (dx / dist) * Math.min(moveAmount, dist)
        pos.z += (dz / dist) * Math.min(moveAmount, dist)
      }
      
      // Rotate panda to face movement direction
      const targetRotation = [Math.PI, -Math.PI/2, 0, Math.PI/2][directionRef.current]
      let rotDiff = targetRotation - groupRef.current.rotation.y
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2
      groupRef.current.rotation.y += rotDiff * 0.3
      
      updatePlayerPosition(pos.x, pos.z, groupRef.current.rotation.y)
    }
    
    // Camera follows player - fixed angle
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
