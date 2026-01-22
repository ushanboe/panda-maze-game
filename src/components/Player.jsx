import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import { AnimatedPanda } from './AnimatedPanda'
import * as THREE from 'three'

const PLAYER_SPEED = 4
const ROTATION_SPEED = 3
const PLAYER_RADIUS = 0.4
const CELL_SIZE = 2

export function Player({ mazeData, walls, onReachExit }) {
  const groupRef = useRef()
  const { camera } = useThree()
  const [isMoving, setIsMoving] = useState(false)
  const [hasWon, setHasWon] = useState(false)
  const keysRef = useRef({ forward: false, backward: false, left: false, right: false })
  
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
  
  // Find initial rotation to face an open direction
  const findOpenDirection = () => {
    const startCell = mazeData.grid[mazeData.start.y][mazeData.start.x]
    if (!startCell.top) return Math.PI
    if (!startCell.right) return -Math.PI / 2
    if (!startCell.bottom) return 0
    if (!startCell.left) return Math.PI / 2
    return 0
  }
  
  // Handle keyboard input - HOLD to move
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return
      
      switch(e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.forward = true
          break
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.backward = true
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
          keysRef.current.forward = false
          break
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.backward = false
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
  
  // Initialize position and rotation
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(startPos.x, 0, startPos.z)
      groupRef.current.rotation.y = findOpenDirection()
      updatePlayerPosition(startPos.x, startPos.z, groupRef.current.rotation.y)
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
    
    const { forward, backward, left, right } = keysRef.current
    const currentPos = groupRef.current.position
    const rotation = groupRef.current.rotation.y
    
    // Handle rotation
    if (left) {
      groupRef.current.rotation.y += ROTATION_SPEED * delta
    }
    if (right) {
      groupRef.current.rotation.y -= ROTATION_SPEED * delta
    }
    
    // Handle movement
    let moveX = 0
    let moveZ = 0
    
    if (forward) {
      moveX = -Math.sin(rotation) * PLAYER_SPEED * delta
      moveZ = -Math.cos(rotation) * PLAYER_SPEED * delta
    }
    if (backward) {
      moveX = Math.sin(rotation) * PLAYER_SPEED * delta * 0.5 // Slower backward
      moveZ = Math.cos(rotation) * PLAYER_SPEED * delta * 0.5
    }
    
    // Update moving state for animation
    const nowMoving = forward || backward
    if (nowMoving !== isMoving) {
      setIsMoving(nowMoving)
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
        // Try sliding along X axis
        if (!checkCollision(newX, currentPos.z)) {
          currentPos.x = newX
        }
        // Try sliding along Z axis
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
    
    // Update camera to follow player
    const playerPos = groupRef.current.position
    const playerRot = groupRef.current.rotation.y
    
    const cameraDistance = 10
    const cameraHeight = 8
    const cameraOffset = new THREE.Vector3(
      Math.sin(playerRot) * cameraDistance,
      cameraHeight,
      Math.cos(playerRot) * cameraDistance
    )
    
    const targetCameraPos = new THREE.Vector3(
      playerPos.x + cameraOffset.x,
      playerPos.y + cameraOffset.y,
      playerPos.z + cameraOffset.z
    )
    
    camera.position.lerp(targetCameraPos, 0.05)
    camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z)
  })
  
  return (
    <group ref={groupRef} position={[startPos.x, 0, startPos.z]}>
      <AnimatedPanda isMoving={isMoving} hasWon={hasWon} scale={0.02} />
    </group>
  )
}
