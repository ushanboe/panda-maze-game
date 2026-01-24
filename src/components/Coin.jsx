
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../stores/gameStore'

// ============================================
// CRYSTAL CONFIGURATIONS - Map point values to GLB files
// ============================================
const CRYSTAL_CONFIG = {
  100: { 
    model: '/models/toon_style_-_crystal.glb',
    scale: 0.8,
    glowColor: '#00ffff',
    name: 'Toon Crystal'
  },
  250: { 
    model: '/models/stylized_crystal.glb',
    scale: 1.0,
    glowColor: '#ff00ff',
    name: 'Stylized Crystal'
  },
  500: { 
    model: '/models/orange_crystal.glb',
    scale: 0.8,
    glowColor: '#ff8800',
    name: 'Orange Crystal'
  },
  1000: { 
    model: '/models/crystal_heart.glb',
    scale: 0.6,
    glowColor: '#ff0066',
    name: 'Crystal Heart'
  }
}

// Preload all crystal models
Object.values(CRYSTAL_CONFIG).forEach(config => {
  useGLTF.preload(config.model)
})

// ============================================
// CRYSTAL MODEL COMPONENT - Loads and displays GLB
// ============================================
function CrystalModel({ modelPath, scale }) {
  const { scene } = useGLTF(modelPath)

  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    // Enhance materials for better visibility
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        // Make materials more emissive/bright if they exist
        if (child.material) {
          const mat = child.material.clone()
          mat.emissiveIntensity = 0.5
          if (!mat.emissive) mat.emissive = new THREE.Color(0x444444)
          child.material = mat
        }
      }
    })
    return clone
  }, [scene])

  return <primitive object={clonedScene} scale={scale} />
}

// ============================================
// ANIMATED CRYSTAL WRAPPER - Handles rotation & float
// Height at 2.5 (panda head height)
// ============================================
function AnimatedCrystal({ children, id }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      // Rotate
      groupRef.current.rotation.y += 0.03
      // Float up and down at head height (2.5)
      groupRef.current.position.y = 2.5 + Math.sin(state.clock.elapsedTime * 2 + id) * 0.3
    }
  })

  return (
    <group ref={groupRef} position={[0, 2.5, 0]}>
      {children}
    </group>
  )
}

// ============================================
// GROUND GLOW - Circle under crystal
// ============================================
function GroundGlow({ color }) {
  const glowRef = useRef()

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.2
      glowRef.current.material.opacity = pulse
    }
  })

  return (
    <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <circleGeometry args={[1.0, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </mesh>
  )
}

// ============================================
// MAIN COIN/CRYSTAL COMPONENT
// ============================================
export function Coin({ id, x, z, value, collected }) {
  // Don't render if collected
  if (collected) return null

  // Get config for this crystal value
  const config = CRYSTAL_CONFIG[value] || CRYSTAL_CONFIG[100]
  const { model, scale, glowColor } = config

  return (
    <group position={[x, 0, z]}>
      {/* Ground glow */}
      <GroundGlow color={glowColor} />

      {/* Animated crystal - NO SUSPENSE/FALLBACK to avoid overlay */}
      <AnimatedCrystal id={id}>
        <CrystalModel modelPath={model} scale={scale} />
      </AnimatedCrystal>

      {/* Point light to make crystal glow */}
      <pointLight
        position={[0, 2.5, 0]}
        color={glowColor}
        intensity={0.8}
        distance={4}
      />
    </group>
  )
}

// ============================================
// COINS CONTAINER - Renders all coins from store
// ============================================
export function Coins() {
  const coins = useGameStore((state) => state.coins)

  if (!coins || coins.length === 0) {
    return null
  }

  return (
    <>
      {coins.map((coin) => (
        <Coin key={coin.id} {...coin} />
      ))}
    </>
  )
}
