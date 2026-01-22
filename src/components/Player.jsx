import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from './useKeyboardControls'
import { useGameStore } from '../stores/gameStore'
import * as THREE from 'three'

const PLAYER_SPEED = 5
const PLAYER_RADIUS = 0.4
const CELL_SIZE = 2

export function Player({ mazeData, walls, onReachExit }) {
  const meshRef = useRef()
  const { camera } = useThree()
  const keys = useKeyboardControls()
  
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
    if (meshRef.current) {
      meshRef.current.position.set(startPos.x, 0.5, startPos.z)
      updatePlayerPosition(startPos.x, startPos.z, 0)
    }
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
    if (!meshRef.current || gameState !== 'playing') return
    
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
    
    if (moveX !== 0 || moveZ !== 0) {
      const currentPos = meshRef.current.position
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
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotation,
        0.15
      )
      
      // Update store
      updatePlayerPosition(currentPos.x, currentPos.z, meshRef.current.rotation.y)
      
      // Check win condition
      if (checkExit(currentPos.x, currentPos.z)) {
        onReachExit()
      }
    }
    
    // Update camera to follow player (third person)
    const playerPos = meshRef.current.position
    const cameraOffset = new THREE.Vector3(0, 8, 10)
    const targetCameraPos = new THREE.Vector3(
      playerPos.x + cameraOffset.x,
      playerPos.y + cameraOffset.y,
      playerPos.z + cameraOffset.z
    )
    
    camera.position.lerp(targetCameraPos, 0.05)
    camera.lookAt(playerPos.x, playerPos.y, playerPos.z)
  })
  
  return (
    <group ref={meshRef} position={[startPos.x, 0.5, startPos.z]}>
      {/* Panda body (placeholder - white capsule) */}
      <mesh castShadow>
        <capsuleGeometry args={[0.35, 0.5, 8, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Panda head */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Ears (black) */}
      <mesh position={[-0.2, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.2, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Eyes (black patches) */}
      <mesh position={[-0.12, 0.65, 0.22]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.12, 0.65, 0.22]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Nose */}
      <mesh position={[0, 0.55, 0.28]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )
}
