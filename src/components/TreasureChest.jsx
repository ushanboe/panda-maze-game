import { useRef, useMemo, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useGameStore } from '../stores/gameStore'
import { ErrorBoundary } from './ErrorBoundary'

// Preload treasure chest model at module level
useGLTF.preload('/models/treasure_chest.glb')

// ============================================
// FALLBACK CHEST - Simple geometry, always works
// ============================================
function FallbackChest({ color = '#8B4513', scale = 1 }) {
  return (
    <group scale={scale}>
      {/* Chest base */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.8, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Chest lid */}
      <mesh position={[0, 0.5, -0.2]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[1.2, 0.2, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Gold trim */}
      <mesh position={[0, 0.1, 0.41]}>
        <boxGeometry args={[1.0, 0.15, 0.05]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Lock */}
      <mesh position={[0, 0.2, 0.42]}>
        <boxGeometry args={[0.15, 0.2, 0.05]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Glowing coins inside */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
    </group>
  )
}

// ============================================
// GLB CHEST MODEL - Loads the actual model
// useGLTF is at TOP LEVEL - unconditional!
// Model is ~4.2 units wide, ~3.77 units tall
// ============================================
function ChestModel({ scale }) {
  const { scene } = useGLTF('/models/treasure_chest.glb')
  const cloned = useMemo(() => {
    const clone = scene.clone()
    // Traverse and ensure materials are properly set up
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [scene])
  // Model is already oriented correctly, just scale it down
  // Offset Y slightly to account for model origin
  return <primitive object={cloned} scale={scale} position={[0, -0.05, 0]} />
}

// ============================================
// GROUND GLOW - Circle under chest
// ============================================
function GroundGlow({ color }) {
  const glowRef = useRef()

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.2
      glowRef.current.material.opacity = pulse
    }
  })

  return (
    <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <circleGeometry args={[1.5, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </mesh>
  )
}

// ============================================
// PARTICLE BEAM - Vertical light effect
// ============================================
function ParticleBeam({ color }) {
  const beamRef = useRef()

  useFrame((state) => {
    if (beamRef.current) {
      beamRef.current.rotation.y += 0.02
      const scale = 0.8 + Math.sin(state.clock.elapsedTime * 4) * 0.2
      beamRef.current.scale.set(scale, 1, scale)
    }
  })

  return (
    <group ref={beamRef}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 2, 0]} rotation={[0, (Math.PI / 2) * i, 0]}>
          <planeGeometry args={[0.1, 4]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} side={2} />
        </mesh>
      ))}
    </group>
  )
}

// ============================================
// ANIMATED CHEST WRAPPER - Handles float
// ============================================
function AnimatedChestWrapper({ children }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      // Float up and down
      groupRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15
      // Gentle rotation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2
    }
  })

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      {children}
    </group>
  )
}

// ============================================
// MAIN TREASURE CHEST COMPONENT
// ============================================
export function TreasureChest({ type = '10K' }) {
  // Get treasure state from store
  const treasure10K = useGameStore((state) => state.treasure10K)
  const treasure50K = useGameStore((state) => state.treasure50K)

  // Select which treasure to use
  const treasure = type === '10K' ? treasure10K : treasure50K

  // Don't render if collected or not visible
  if (!treasure || treasure.collected || !treasure.visible) {
    return null
  }

  // Validate position
  const x = treasure.x || 0
  const z = treasure.z || 0
  if (x === 0 && z === 0) {
    return null
  }

  // Configuration based on type
  // Model is ~4.2 units wide, scale down to fit in maze cells
  const glowColor = type === '10K' ? '#ffd700' : '#ff00ff'
  const chestColor = type === '10K' ? '#8B4513' : '#4B0082'
  const scale = type === '10K' ? 0.25 : 0.35  // Adjusted for ~4.2 unit model

  return (
    <group position={[x, 0, z]}>
      {/* Ground glow */}
      <GroundGlow color={glowColor} />

      {/* Particle beam */}
      <ParticleBeam color={glowColor} />

      {/* Animated chest with GLB model */}
      <AnimatedChestWrapper>
        <ErrorBoundary fallback={<FallbackChest color={chestColor} scale={scale * 2} />}>
          <Suspense fallback={<FallbackChest color={chestColor} scale={scale * 2} />}>
            <ChestModel scale={scale} />
          </Suspense>
        </ErrorBoundary>
      </AnimatedChestWrapper>
    </group>
  )
}
