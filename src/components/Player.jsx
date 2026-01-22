import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from './useKeyboardControls'
import { useGameStore } from '../stores/gameStore'
import * as THREE from 'three'

const PLAYER_SPEED = 5
const PLAYER_RADIUS = 0.6
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
      meshRef.current.position.set(startPos.x, 1.0, startPos.z)
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
    
    // Update camera to follow player (third person) - raised higher for bigger panda
    const playerPos = meshRef.current.position
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
    <group ref={meshRef} position={[startPos.x, 1.0, startPos.z]}>
      {/* Panda body - BIGGER & FATTER */}
      <mesh castShadow>
        <capsuleGeometry args={[0.7, 1.2, 8, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Panda belly (slightly darker/cream for depth) */}
      <mesh position={[0, -0.1, 0.35]} castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#f5f5f0" />
      </mesh>
      
      {/* Panda head - bigger */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Ears (black) - repositioned for bigger head */}
      <mesh position={[-0.4, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.4, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Eyes (black patches) - bigger */}
      <mesh position={[-0.2, 1.15, 0.4]} castShadow>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.2, 1.15, 0.4]} castShadow>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Eye whites (small dots) */}
      <mesh position={[-0.18, 1.18, 0.52]} castShadow>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.22, 1.18, 0.52]} castShadow>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Nose */}
      <mesh position={[0, 1.0, 0.52]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Arms (black) */}
      <mesh position={[-0.65, 0.2, 0]} rotation={[0, 0, 0.3]} castShadow>
        <capsuleGeometry args={[0.18, 0.5, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.65, 0.2, 0]} rotation={[0, 0, -0.3]} castShadow>
        <capsuleGeometry args={[0.18, 0.5, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Legs (black) */}
      <mesh position={[-0.3, -0.8, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.4, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.3, -0.8, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.4, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )
}
