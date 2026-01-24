import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { useGameStore } from '../stores/gameStore'

// BFS pathfinding to find path from ghost to player
function findPath(maze, start, end) {
  const rows = maze.length
  const cols = maze[0].length

  // Convert world positions to grid positions
  const startGrid = { x: Math.round(start.x), z: Math.round(start.z) }
  const endGrid = { x: Math.round(end.x), z: Math.round(end.z) }

  // Clamp to maze bounds
  startGrid.x = Math.max(0, Math.min(cols - 1, startGrid.x))
  startGrid.z = Math.max(0, Math.min(rows - 1, startGrid.z))
  endGrid.x = Math.max(0, Math.min(cols - 1, endGrid.x))
  endGrid.z = Math.max(0, Math.min(rows - 1, endGrid.z))

  const queue = [{ ...startGrid, path: [] }]
  const visited = new Set()
  visited.add(`${startGrid.x},${startGrid.z}`)

  const directions = [
    { dx: 0, dz: -1 }, // up
    { dx: 0, dz: 1 },  // down
    { dx: -1, dz: 0 }, // left
    { dx: 1, dz: 0 }   // right
  ]

  while (queue.length > 0) {
    const current = queue.shift()

    if (current.x === endGrid.x && current.z === endGrid.z) {
      return current.path
    }

    for (const dir of directions) {
      const nx = current.x + dir.dx
      const nz = current.z + dir.dz
      const key = `${nx},${nz}`

      if (nx >= 0 && nx < cols && nz >= 0 && nz < rows && 
          !visited.has(key) && maze[nz][nx] === 0) {
        visited.add(key)
        queue.push({
          x: nx,
          z: nz,
          path: [...current.path, { x: nx, z: nz }]
        })
      }
    }
  }

  return [] // No path found
}

// Procedural ghost as fallback
function ProceduralGhost({ position, opacity }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return
    // Floating animation
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Ghost body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
        <meshStandardMaterial 
          color="#8844ff" 
          transparent 
          opacity={opacity * 0.7}
          emissive="#4422aa"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 0.2, 0.25]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.1, 0.2, 0.25]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.1, 0.2, 0.32]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.1, 0.2, 0.32]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Glow effect */}
      <pointLight color="#8844ff" intensity={0.5} distance={3} />
    </group>
  )
}

export function Ghost({ mazeData, walls, onCatchPlayer }) {
  const groupRef = useRef()
  const mixerRef = useRef(null)
  const [useFallback, setUseFallback] = useState(false)

  // Ghost state
  const [ghostPos, setGhostPos] = useState({ x: 1, z: 1 })
  const [targetPos, setTargetPos] = useState(null)
  const [path, setPath] = useState([])
  const [opacity, setOpacity] = useState(0)

  // Get player position and game state from store
  const playerPosition = useGameStore(state => state.playerPosition)
  const gameState = useGameStore(state => state.gameState)
  const playerCaught = useGameStore(state => state.playerCaught)
  const setPlayerCaught = useGameStore(state => state.setPlayerCaught)

  const GHOST_SPEED = 2.5
  const CATCH_DISTANCE = 0.8

  // Try to load FBX model with error handling
  let ghostFbx = null
  let loadError = false

  try {
    ghostFbx = useLoader(FBXLoader, '/models/ghost.fbx')
  } catch (error) {
    console.error('Ghost FBX loading error:', error)
    loadError = true
  }

  // Set fallback if loading fails
  useEffect(() => {
    if (loadError) {
      console.log('Using procedural ghost fallback due to FBX load error')
      setUseFallback(true)
    }
  }, [loadError])

  // Clone the model
  const clonedModel = useMemo(() => {
    if (!ghostFbx || useFallback) return null
    try {
      const clone = SkeletonUtils.clone(ghostFbx)

      clone.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          if (child.material) {
            child.material = child.material.clone()
            child.material.transparent = true
            child.material.opacity = 0.7
            // Add ghostly glow
            child.material.emissive = new THREE.Color(0x4422aa)
            child.material.emissiveIntensity = 0.3
          }
        }
      })

      return clone
    } catch (error) {
      console.error('Error cloning ghost model:', error)
      setUseFallback(true)
      return null
    }
  }, [ghostFbx, useFallback])

  // Setup animation mixer
  useEffect(() => {
    if (!clonedModel || useFallback) return

    try {
      const mixer = new THREE.AnimationMixer(clonedModel)
      mixerRef.current = mixer

      if (ghostFbx.animations && ghostFbx.animations.length > 0) {
        const action = mixer.clipAction(ghostFbx.animations[0])
        action.play()
      }

      return () => {
        mixer.stopAllAction()
      }
    } catch (error) {
      console.error('Error setting up ghost animations:', error)
      setUseFallback(true)
    }
  }, [clonedModel, ghostFbx, useFallback])

  // Initialize ghost position
  useEffect(() => {
    if (mazeData && mazeData.length > 0) {
      // Start ghost at a position away from player
      const startX = mazeData[0].length - 2
      const startZ = mazeData.length - 2
      setGhostPos({ x: startX, z: startZ })
    }
  }, [mazeData])

  // Fade in ghost
  useEffect(() => {
    if (gameState === 'playing') {
      const fadeIn = setInterval(() => {
        setOpacity(prev => {
          if (prev >= 0.7) {
            clearInterval(fadeIn)
            return 0.7
          }
          return prev + 0.05
        })
      }, 100)
      return () => clearInterval(fadeIn)
    }
  }, [gameState])

  // Pathfinding - update path periodically
  useEffect(() => {
    if (!mazeData || !playerPosition || gameState !== 'playing' || playerCaught) return

    const updatePath = () => {
      const newPath = findPath(
        mazeData,
        ghostPos,
        { x: playerPosition.x, z: playerPosition.z }
      )
      setPath(newPath)
      if (newPath.length > 0) {
        setTargetPos(newPath[0])
      }
    }

    updatePath()
    const interval = setInterval(updatePath, 500) // Update path every 500ms

    return () => clearInterval(interval)
  }, [mazeData, playerPosition, ghostPos, gameState, playerCaught])

  // Movement and animation loop
  useFrame((state, delta) => {
    if (gameState !== 'playing' || playerCaught) return

    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    // Move towards target
    if (targetPos) {
      const dx = targetPos.x - ghostPos.x
      const dz = targetPos.z - ghostPos.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist > 0.1) {
        const moveX = (dx / dist) * GHOST_SPEED * delta
        const moveZ = (dz / dist) * GHOST_SPEED * delta

        setGhostPos(prev => ({
          x: prev.x + moveX,
          z: prev.z + moveZ
        }))

        // Rotate to face movement direction
        if (groupRef.current) {
          const angle = Math.atan2(dx, dz)
          groupRef.current.rotation.y = angle
        }
      } else {
        // Reached target, get next point in path
        if (path.length > 1) {
          setPath(prev => prev.slice(1))
          setTargetPos(path[1])
        }
      }
    }

    // Check if caught player
    if (playerPosition) {
      const distToPlayer = Math.sqrt(
        Math.pow(ghostPos.x - playerPosition.x, 2) +
        Math.pow(ghostPos.z - playerPosition.z, 2)
      )

      if (distToPlayer < CATCH_DISTANCE) {
        setPlayerCaught(true)
        if (onCatchPlayer) onCatchPlayer()
      }
    }

    // Floating animation
    if (groupRef.current) {
      groupRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2
    }
  })

  const position = [ghostPos.x, 0.5, ghostPos.z]

  // Use procedural fallback if FBX loading failed
  if (useFallback || !clonedModel) {
    return (
      <group ref={groupRef} position={position}>
        <ProceduralGhost position={[0, 0, 0]} opacity={opacity} />
      </group>
    )
  }

  return (
    <group ref={groupRef} position={position}>
      <primitive object={clonedModel} scale={0.008} />
      <pointLight color="#8844ff" intensity={0.5} distance={3} />
    </group>
  )
}
