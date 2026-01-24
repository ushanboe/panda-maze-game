
import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useFBX } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useGameStore } from '../stores/gameStore'

const CELL_SIZE = 2
const GHOST_SPEED = 4  // Slightly slower than player (6)
const GHOST_RADIUS = 0.8
const CATCH_DISTANCE = 1.2

// BFS pathfinding - optimized with parent tracking
function findPath(start, goal, walls, mazeWidth, mazeHeight) {
  const wallSet = new Set(walls.map(w => `${Math.round(w.x)},${Math.round(w.z)}`))

  const startKey = `${Math.round(start.x)},${Math.round(start.z)}`
  const goalKey = `${Math.round(goal.x)},${Math.round(goal.z)}`

  if (startKey === goalKey) return [goal]

  const queue = [{ x: Math.round(start.x), z: Math.round(start.z) }]
  const visited = new Set([startKey])
  const parent = new Map()

  const directions = [
    { dx: 0, dz: -CELL_SIZE },  // Up
    { dx: CELL_SIZE, dz: 0 },   // Right
    { dx: 0, dz: CELL_SIZE },   // Down
    { dx: -CELL_SIZE, dz: 0 }   // Left
  ]

  while (queue.length > 0) {
    const current = queue.shift()
    const currentKey = `${current.x},${current.z}`

    for (const dir of directions) {
      const next = { x: current.x + dir.dx, z: current.z + dir.dz }
      const nextKey = `${next.x},${next.z}`

      if (visited.has(nextKey)) continue
      if (wallSet.has(nextKey)) continue

      visited.add(nextKey)
      parent.set(nextKey, currentKey)

      if (nextKey === goalKey) {
        // Reconstruct path
        const path = []
        let key = goalKey
        while (key && key !== startKey) {
          const [x, z] = key.split(',').map(Number)
          path.unshift({ x, z })
          key = parent.get(key)
        }
        return path
      }

      queue.push(next)
    }
  }

  return []  // No path found
}

export function Ghost({ mazeData, walls, onCatchPlayer }) {
  const groupRef = useRef()
  const mixerRef = useRef(null)

  // Use refs for performance (no re-renders)
  const positionRef = useRef({ x: 0, z: 0 })
  const pathRef = useRef([])
  const pathIndexRef = useRef(0)
  const lastPathTime = useRef(0)
  const isActiveRef = useRef(true)

  // Load ghost FBX
  const ghostFbx = useFBX('/models/ghost.fbx')

  // Clone the model
  const clonedModel = useMemo(() => {
    if (!ghostFbx) return null
    const clone = cloneSkeleton(ghostFbx)

    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        // Make ghost slightly transparent and glowing
        if (child.material) {
          child.material = child.material.clone()
          child.material.transparent = true
          child.material.opacity = 0.85
          child.material.emissive = new THREE.Color(0x4444ff)
          child.material.emissiveIntensity = 0.3
        }
      }
    })

    return clone
  }, [ghostFbx])

  // Setup animation mixer
  useEffect(() => {
    if (!clonedModel || !ghostFbx.animations || ghostFbx.animations.length === 0) return

    const mixer = new THREE.AnimationMixer(clonedModel)
    mixerRef.current = mixer

    // Play first animation (if any)
    const clip = ghostFbx.animations[0]
    const action = mixer.clipAction(clip)
    action.play()

    return () => {
      mixer.stopAllAction()
    }
  }, [clonedModel, ghostFbx])

  // Calculate ghost start position (at exit)
  const exitPos = useMemo(() => ({
    x: (mazeData.exit.x - mazeData.width / 2) * CELL_SIZE + CELL_SIZE / 2,
    z: (mazeData.exit.y - mazeData.height / 2) * CELL_SIZE + CELL_SIZE / 2
  }), [mazeData])

  // Initialize position
  useEffect(() => {
    positionRef.current = { x: exitPos.x, z: exitPos.z }
    pathRef.current = []
    pathIndexRef.current = 0
    isActiveRef.current = true

    if (groupRef.current) {
      groupRef.current.position.set(exitPos.x, 0, exitPos.z)
    }
  }, [exitPos])

  useFrame((state, delta) => {
    if (!groupRef.current || !isActiveRef.current) return

    // Update animation
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    // Get player position directly from store (no subscription)
    const playerPos = useGameStore.getState().playerPosition
    if (!playerPos) return

    const ghostPos = positionRef.current
    const now = state.clock.elapsedTime

    // Check if caught player
    const distToPlayer = Math.hypot(ghostPos.x - playerPos.x, ghostPos.z - playerPos.z)
    if (distToPlayer < CATCH_DISTANCE) {
      isActiveRef.current = false
      onCatchPlayer()
      return
    }

    // Recalculate path every 0.5 seconds
    if (now - lastPathTime.current > 0.5) {
      lastPathTime.current = now

      // Snap ghost position to grid for pathfinding
      const snappedGhost = {
        x: Math.round(ghostPos.x / CELL_SIZE) * CELL_SIZE,
        z: Math.round(ghostPos.z / CELL_SIZE) * CELL_SIZE
      }

      const snappedPlayer = {
        x: Math.round(playerPos.x / CELL_SIZE) * CELL_SIZE,
        z: Math.round(playerPos.z / CELL_SIZE) * CELL_SIZE
      }

      pathRef.current = findPath(snappedGhost, snappedPlayer, walls, mazeData.width, mazeData.height)
      pathIndexRef.current = 0
    }

    // Move along path
    const path = pathRef.current
    if (path.length > 0 && pathIndexRef.current < path.length) {
      const target = path[pathIndexRef.current]
      const dx = target.x - ghostPos.x
      const dz = target.z - ghostPos.z
      const dist = Math.hypot(dx, dz)

      if (dist < 0.2) {
        // Reached waypoint, move to next
        pathIndexRef.current++
      } else {
        // Move towards target
        const moveAmount = GHOST_SPEED * delta
        ghostPos.x += (dx / dist) * Math.min(moveAmount, dist)
        ghostPos.z += (dz / dist) * Math.min(moveAmount, dist)

        // Rotate to face movement direction
        const angle = Math.atan2(dx, dz)
        groupRef.current.rotation.y = angle
      }
    }

    // Update visual position
    groupRef.current.position.x = ghostPos.x
    groupRef.current.position.z = ghostPos.z

    // Floating animation
    groupRef.current.position.y = Math.sin(now * 3) * 0.2 + 0.5
  })

  if (!clonedModel) {
    // Loading placeholder
    return (
      <mesh position={[exitPos.x, 1, exitPos.z]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#8888ff" transparent opacity={0.5} />
      </mesh>
    )
  }

  return (
    <group ref={groupRef} position={[exitPos.x, 0.5, exitPos.z]}>
      <primitive object={clonedModel} scale={[0.01, 0.01, 0.01]} />
      {/* Ghost glow */}
      <pointLight color="#6666ff" intensity={2} distance={5} />
    </group>
  )
}
