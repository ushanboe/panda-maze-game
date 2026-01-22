import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from './useKeyboardControls'
import { useGameStore } from '../stores/gameStore'
import { AnimatedPanda } from './AnimatedPanda'
import * as THREE from 'three'

const PLAYER_SPEED = 5
const ROTATION_SPEED = 3 // radians per second
const PLAYER_RADIUS = 0.6
const CELL_SIZE = 2

export function Player({ mazeData, walls, onReachExit }) {
  const groupRef = useRef()
  const { camera } = useThree()
  const keys = useKeyboardControls()
  const [isMoving, setIsMoving] = useState(false)
  const [hasWon, setHasWon] = useState(false)
  
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
    // Check which walls are open (false = no wall = open)
    if (!startCell.top) return Math.PI // face up (negative Z)
    if (!startCell.right) return -Math.PI / 2 // face right (positive X)
    if (!startCell.bottom) return 0 // face down (positive Z)
    if (!startCell.left) return Math.PI / 2 // face left (negative X)
    return 0
  }
  
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
  const checkCollision = (newX, newZ) => {
    for (const wall of walls) {
      const dx = Math.abs(newX - wall.x)
      const dz = Math.abs(newZ - wall.z)
      
      // Simple box collision
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
      setIsMoving(false)
      return
    }
    
    const { forward, backward, left, right } = keys.current
    
    // CHARACTER-RELATIVE CONTROLS
    // A/Left and D/Right = rotate
    // W/Up and S/Down = move forward/backward in facing direction
    
    // Handle rotation
    if (left) {
      groupRef.current.rotation.y += ROTATION_SPEED * delta
    }
    if (right) {
      groupRef.current.rotation.y -= ROTATION_SPEED * delta
    }
    
    // Handle movement (forward/backward relative to facing direction)
    let moveSpeed = 0
    if (forward) moveSpeed = PLAYER_SPEED
    if (backward) moveSpeed = -PLAYER_SPEED * 0.5 // slower backward
    
    const moving = moveSpeed !== 0
    setIsMoving(moving)
    
    if (moving) {
      const currentPos = groupRef.current.position
      const rotation = groupRef.current.rotation.y
      
      // Calculate movement direction based on facing
      const moveX = Math.sin(rotation) * moveSpeed * delta
      const moveZ = Math.cos(rotation) * moveSpeed * delta
      
      // Calculate new position
      let newX = currentPos.x - moveX
      let newZ = currentPos.z - moveZ
      
      // Check collisions separately for X and Z for sliding along walls
      if (!checkCollision(newX, currentPos.z)) {
        currentPos.x = newX
      }
      if (!checkCollision(currentPos.x, newZ)) {
        currentPos.z = newZ
      }
      
      // Update store
      updatePlayerPosition(currentPos.x, currentPos.z, groupRef.current.rotation.y)
      
      // Check win condition
      if (checkExit(currentPos.x, currentPos.z) && !hasWon) {
        setHasWon(true)
        onReachExit()
      }
    }
    
    // Update camera to follow player (third person) - behind the player
    const playerPos = groupRef.current.position
    const playerRot = groupRef.current.rotation.y
    
    // Camera follows behind the player based on their rotation
    const cameraDistance = 12
    const cameraHeight = 10
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
      <AnimatedPanda isMoving={isMoving} hasWon={hasWon} scale={0.0075} />
    </group>
  )
}
