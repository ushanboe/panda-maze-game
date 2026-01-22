import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import { AnimatedPanda } from './AnimatedPanda'
import * as THREE from 'three'

const PLAYER_SPEED = 4
const PLAYER_RADIUS = 0.4
const CELL_SIZE = 2

export function Player({ mazeData, walls, onReachExit }) {
  const groupRef = useRef()
  const { camera } = useThree()
  const [isMoving, setIsMoving] = useState(false)
  const [hasWon, setHasWon] = useState(false)
  const keysRef = useRef({ up: false, down: false, left: false, right: false })
  
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
  
  // Handle keyboard input - WORLD RELATIVE
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return
      
      switch(e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.up = true
          break
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.down = true
          break
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.left = true
          break
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.right = true
          break
      }
    }
    
    const handleKeyUp = (e) => {
      switch(e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.up = false
          break
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.down = false
          break
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.left = false
          break
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.right = false
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState])
  
  // Initialize position
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(startPos.x, 0, startPos.z)
      groupRef.current.rotation.y = 0
      updatePlayerPosition(startPos.x, startPos.z, 0)
    }
    setHasWon(false)
  }, [mazeData])
  
  // Check collision with walls
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
  
  // Check if reached exit
  const checkExit = (x, z) => {
    const dx = Math.abs(x - exitPos.x)
    const dz = Math.abs(z - exitPos.z)
    return dx < CELL_SIZE && dz < CELL_SIZE
  }
  
  useFrame((state, delta) => {
    if (!groupRef.current || gameState !== 'playing') {
      return
    }
    
    const { up, down, left, right } = keysRef.current
    const currentPos = groupRef.current.position
    
    // Calculate world-relative movement
    let moveX = 0
    let moveZ = 0
    
    if (up) moveZ -= PLAYER_SPEED * delta    // W = move forward (negative Z)
    if (down) moveZ += PLAYER_SPEED * delta  // S = move backward (positive Z)
    if (left) moveX -= PLAYER_SPEED * delta  // A = move left (negative X)
    if (right) moveX += PLAYER_SPEED * delta // D = move right (positive X)
    
    // Update moving state for animation
    const nowMoving = up || down || left || right
    if (nowMoving !== isMoving) {
      setIsMoving(nowMoving)
    }
    
    // Auto-rotate panda to face movement direction
    if (moveX !== 0 || moveZ !== 0) {
      const targetAngle = Math.atan2(moveX, moveZ)
      // Smooth rotation
      let currentAngle = groupRef.current.rotation.y
      let angleDiff = targetAngle - currentAngle
      
      // Normalize angle difference to -PI to PI
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      
      groupRef.current.rotation.y += angleDiff * 0.2
    }
    
    // Apply movement with collision detection
    if (moveX !== 0 || moveZ !== 0) {
      const newX = currentPos.x + moveX
      const newZ = currentPos.z + moveZ
      
      // Try full movement first
      if (!checkCollision(newX, newZ)) {
        currentPos.x = newX
        currentPos.z = newZ
      } else {
        // Try sliding along X axis only
        if (!checkCollision(newX, currentPos.z)) {
          currentPos.x = newX
        }
        // Try sliding along Z axis only
        else if (!checkCollision(currentPos.x, newZ)) {
          currentPos.z = newZ
        }
        // Fully blocked - don't move
      }
      
      // Update store
      updatePlayerPosition(currentPos.x, currentPos.z, groupRef.current.rotation.y)
      
      // Check win condition
      if (checkExit(currentPos.x, currentPos.z) && !hasWon) {
        setHasWon(true)
        onReachExit()
      }
    }
    
    // Fixed camera position - top-down angled view
    const playerPos = groupRef.current.position
    const cameraDistance = 12
    const cameraHeight = 10
    
    const targetCameraPos = new THREE.Vector3(
      playerPos.x,
      playerPos.y + cameraHeight,
      playerPos.z + cameraDistance
    )
    
    camera.position.lerp(targetCameraPos, 0.05)
    camera.lookAt(playerPos.x, playerPos.y, playerPos.z)
  })
  
  return (
    <group ref={groupRef} position={[startPos.x, 0, startPos.z]}>
      <AnimatedPanda isMoving={isMoving} hasWon={hasWon} scale={0.02} />
    </group>
  )
}
