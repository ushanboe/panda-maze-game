import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import { AnimatedPanda } from './AnimatedPanda'
import * as THREE from 'three'

const PLAYER_SPEED = 4
const ROTATION_SPEED = 3
const PLAYER_RADIUS = 0.4 // Reduced for easier navigation
const CELL_SIZE = 2
const WALL_PUSH_STRENGTH = 0.1 // How much to push away from side walls

export function Player({ mazeData, walls, onReachExit }) {
  const groupRef = useRef()
  const { camera } = useThree()
  const [isWalking, setIsWalking] = useState(false)
  const [hasWon, setHasWon] = useState(false)
  const keysRef = useRef({ left: false, right: false })
  
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
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return
      
      switch(e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setIsWalking(prev => !prev)
          break
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.left = true
          break
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.right = true
          break
        case 'KeyS':
        case 'ArrowDown':
          setIsWalking(false)
          break
      }
    }
    
    const handleKeyUp = (e) => {
      switch(e.code) {
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
    setIsWalking(false)
  }, [mazeData])
  
  // Check collision with a specific wall and return collision info
  const getWallCollision = (x, z, wall) => {
    const dx = x - wall.x
    const dz = z - wall.z
    const halfWall = CELL_SIZE / 2
    const totalRadius = halfWall + PLAYER_RADIUS
    
    // Check if within collision range
    if (Math.abs(dx) < totalRadius && Math.abs(dz) < totalRadius) {
      // Determine which side we're colliding with
      const overlapX = totalRadius - Math.abs(dx)
      const overlapZ = totalRadius - Math.abs(dz)
      
      return {
        colliding: true,
        overlapX: overlapX * Math.sign(dx),
        overlapZ: overlapZ * Math.sign(dz),
        isMoreX: overlapX < overlapZ // Which axis has less overlap (that's the collision side)
      }
    }
    return { colliding: false }
  }
  
  // Check if there's a wall directly in front of the player
  const checkFrontCollision = (x, z, rotation) => {
    const forwardX = -Math.sin(rotation)
    const forwardZ = -Math.cos(rotation)
    const checkDist = PLAYER_RADIUS + 0.3 // Check slightly ahead
    
    const frontX = x + forwardX * checkDist
    const frontZ = z + forwardZ * checkDist
    
    for (const wall of walls) {
      const collision = getWallCollision(frontX, frontZ, wall)
      if (collision.colliding) {
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
    
    const { left, right } = keysRef.current
    
    // Handle rotation (always works)
    if (left) {
      groupRef.current.rotation.y += ROTATION_SPEED * delta
    }
    if (right) {
      groupRef.current.rotation.y -= ROTATION_SPEED * delta
    }
    
    // Handle walking
    if (isWalking) {
      const currentPos = groupRef.current.position
      const rotation = groupRef.current.rotation.y
      
      // Check if there's a wall directly in front - only then stop
      if (checkFrontCollision(currentPos.x, currentPos.z, rotation)) {
        setIsWalking(false)
        console.log('Hit front wall - stopped')
      } else {
        // Calculate movement direction based on facing
        const moveX = -Math.sin(rotation) * PLAYER_SPEED * delta
        const moveZ = -Math.cos(rotation) * PLAYER_SPEED * delta
        
        // Apply movement
        let newX = currentPos.x + moveX
        let newZ = currentPos.z + moveZ
        
        // Check for side collisions and push away (slide along walls)
        for (const wall of walls) {
          const collision = getWallCollision(newX, newZ, wall)
          if (collision.colliding) {
            // Push away from the wall based on which side we're touching
            if (collision.isMoreX) {
              // Collision is more on X axis - push on X
              newX += collision.overlapX * WALL_PUSH_STRENGTH * 2
            } else {
              // Collision is more on Z axis - push on Z
              newZ += collision.overlapZ * WALL_PUSH_STRENGTH * 2
            }
          }
        }
        
        // Final collision check to prevent going through walls
        let canMove = true
        for (const wall of walls) {
          const dx = Math.abs(newX - wall.x)
          const dz = Math.abs(newZ - wall.z)
          if (dx < (CELL_SIZE / 2 + PLAYER_RADIUS * 0.8) && dz < (CELL_SIZE / 2 + PLAYER_RADIUS * 0.8)) {
            canMove = false
            break
          }
        }
        
        if (canMove) {
          currentPos.x = newX
          currentPos.z = newZ
        }
        
        // Update store
        updatePlayerPosition(currentPos.x, currentPos.z, groupRef.current.rotation.y)
        
        // Check win condition
        if (checkExit(currentPos.x, currentPos.z) && !hasWon) {
          setHasWon(true)
          setIsWalking(false)
          onReachExit()
        }
      }
    }
    
    // Update camera to follow player
    const playerPos = groupRef.current.position
    const playerRot = groupRef.current.rotation.y
    
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
      <AnimatedPanda isMoving={isWalking} hasWon={hasWon} scale={0.0075} />
    </group>
  )
}
