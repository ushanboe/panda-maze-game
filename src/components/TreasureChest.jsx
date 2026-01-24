
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../stores/gameStore'

// ============================================
// TREASURE CRYSTAL CONFIGURATIONS
// Using magic_crystal.glb for treasures
// ============================================
const TREASURE_CONFIG = {
  10000: {
    model: '/models/magic_crystal.glb',
    scale: 1.5,
    glowColor: '#00ff88',
    name: 'Magic Crystal (10K)'
  },
  50000: {
    model: '/models/magic_crystal.glb',
    scale: 2.5,
    glowColor: '#ffaa00',
    name: 'Grand Magic Crystal (50K)'
  }
}

// Preload treasure model
useGLTF.preload('/models/magic_crystal.glb')

// ============================================
// TREASURE CRYSTAL MODEL - Loads and displays GLB
// ============================================
function TreasureCrystalModel({ modelPath, scale }) {
  const { scene } = useGLTF(modelPath)

  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    // Enhance materials for better visibility
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        // Make materials more emissive/bright
        if (child.material) {
          const mat = child.material.clone()
          mat.emissiveIntensity = 0.8
          if (!mat.emissive) mat.emissive = new THREE.Color(0x666666)
          child.material = mat
        }
      }
    })
    return clone
  }, [scene])

  return <primitive object={clonedScene} scale={scale} />
}

// ============================================
// ANIMATED TREASURE WRAPPER - Rotation & float
// Height at 2.5 (panda head height)
// ============================================
function AnimatedTreasure({ children, id }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      // Rotate slowly
      groupRef.current.rotation.y += 0.02
      // Float up and down at head height
      groupRef.current.position.y = 2.5 + Math.sin(state.clock.elapsedTime * 1.5 + id) * 0.4
    }
  })

  return (
    <group ref={groupRef} position={[0, 2.5, 0]}>
      {children}
    </group>
  )
}

// ============================================
// GROUND GLOW - Large circle under treasure
// ============================================
function GroundGlow({ color }) {
  const glowRef = useRef()

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3
      glowRef.current.material.opacity = pulse
    }
  })

  return (
    <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <circleGeometry args={[2.0, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} />
    </mesh>
  )
}

// ============================================
// SPARKLE RING around treasure
// ============================================
function SparkleRing({ color }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.04
    }
  })

  return (
    <group ref={groupRef} position={[0, 2.5, 0]}>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
        const angle = (i / 12) * Math.PI * 2
        const radius = 1.8
        return (
          <mesh 
            key={i} 
            position={[
              Math.cos(angle) * radius, 
              Math.sin(i * 0.8) * 0.5, 
              Math.sin(angle) * radius
            ]}
          >
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        )
      })}
    </group>
  )
}

// ============================================
// MAIN TREASURE CHEST COMPONENT
// ============================================
export function TreasureChest({ id, x, z, value, collected }) {
  // Don't render if collected
  if (collected) return null

  // Get config for this treasure value
  const config = TREASURE_CONFIG[value] || TREASURE_CONFIG[10000]
  const { model, scale, glowColor } = config

  return (
    <group position={[x, 0, z]}>
      {/* Ground glow */}
      <GroundGlow color={glowColor} />

      {/* Animated treasure crystal - NO SUSPENSE/FALLBACK */}
      <AnimatedTreasure id={id}>
        <TreasureCrystalModel modelPath={model} scale={scale} />
      </AnimatedTreasure>

      {/* Sparkle ring */}
      <SparkleRing color={glowColor} />

      {/* Point light to make treasure glow */}
      <pointLight
        position={[0, 2.5, 0]}
        color={glowColor}
        intensity={1.5}
        distance={6}
      />
    </group>
  )
}

// ============================================
// TREASURE CHESTS CONTAINER
// ============================================
export function TreasureChests() {
  const treasures = useGameStore((state) => state.treasures)

  if (!treasures || treasures.length === 0) {
    return null
  }

  return (
    <>
      {treasures.map((treasure) => (
        <TreasureChest key={treasure.id} {...treasure} />
      ))}
    </>
  )
}
