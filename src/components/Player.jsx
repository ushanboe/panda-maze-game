import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from './useKeyboardControls'
import { useGameStore } from '../stores/gameStore'
import { AnimatedPanda } from './AnimatedPanda'
import * as THREE from 'three'

const PLAYER_SPEED = 5
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
  
  // Initialize position
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(startPos.x, 0, startPos.z)
      updatePlayerPosition(startPos.x, startPos.z, 0)
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
    
    // Calculate movement direction
    let moveX = 0
    let moveZ = 0
    
    if (forward) moveZ -= 1
    if (backward) moveZ += 1
    if (left) moveX -= 1
    if (right) moveX += 1
    
    // Normalize diagonal movement
    if (moveX !== 0 && moveZ !== 0) {
      const len = Math.sqrt(moveX * moveX + moveZ * moveZ)
      moveX /= len
      moveZ /= len
    }
    
    const moving = moveX !== 0 || moveZ !== 0
    setIsMoving(moving)
    
    if (moving) {
      const currentPos = groupRef.current.position
      const speed = PLAYER_SPEED * delta
      
      // Calculate new position
      let newX = currentPos.x + moveX * speed
      let newZ = currentPos.z + moveZ * speed
      
      // Check collisions separately for X and Z for sliding along walls
      if (!checkCollision(newX, currentPos.z)) {
        currentPos.x = newX
      }
      if (!checkCollision(currentPos.x, newZ)) {
        currentPos.z = newZ
      }
      
      // Update rotation to face movement direction
      const targetRotation = Math.atan2(moveX, moveZ)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.15
      )
      
      // Update store
      updatePlayerPosition(currentPos.x, currentPos.z, groupRef.current.rotation.y)
      
      // Check win condition
      if (checkExit(currentPos.x, currentPos.z) && !hasWon) {
        setHasWon(true)
        onReachExit()
      }
    }
    
    // Update camera to follow player (third person) - raised higher for better view
    const playerPos = groupRef.current.position
    const cameraOffset = new THREE.Vector3(0, 10, 12)
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
      <AnimatedPanda isMoving={isMoving} hasWon={hasWon} scale={0.015} />
    </group>
  )
}
