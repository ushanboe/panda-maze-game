
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../stores/gameStore'

// ============================================
// COIN CONFIGURATIONS - Bright metallic colors
// ============================================
const COIN_CONFIG = {
  100: { 
    name: 'Bronze', 
    color: '#cd7f32', 
    emissive: '#8b4513',
    size: 0.35
  },
  250: { 
    name: 'Silver', 
    color: '#e8e8e8', 
    emissive: '#a0a0a0',
    size: 0.4
  },
  500: { 
    name: 'Gold', 
    color: '#ffd700', 
    emissive: '#ff8c00',
    size: 0.45
  },
  1000: { 
    name: 'Platinum', 
    color: '#e0ffff', 
    emissive: '#87ceeb',
    size: 0.5
  }
}

// ============================================
// PROCEDURAL COIN - Bright, shiny, always works
// ============================================
function ProceduralCoin({ color, emissive, size }) {
  return (
    <group>
      {/* Main coin body */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[size, size, 0.08, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.95}
          roughness={0.05}
          emissive={emissive}
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* Inner ring detail */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 0.7, 0.02, 8, 32]} />
        <meshStandardMaterial
          color={emissive}
          metalness={0.9}
          roughness={0.1}
          emissive={emissive}
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* Center emblem */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[size * 0.3, size * 0.3, 0.02, 6]} />
        <meshStandardMaterial
          color={emissive}
          metalness={0.9}
          roughness={0.1}
          emissive={emissive}
          emissiveIntensity={1.0}
        />
      </mesh>
    </group>
  )
}

// ============================================
// ANIMATED COIN WRAPPER - Handles spin & float
// Height raised to 2.5 so player can see coins
// ============================================
function AnimatedCoinWrapper({ children, id }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      // Spin
      groupRef.current.rotation.y += 0.05
      // Float up and down - raised to 2.5 (panda eye level)
      groupRef.current.position.y = 2.5 + Math.sin(state.clock.elapsedTime * 2 + id) * 0.2
    }
  })

  return (
    <group ref={groupRef} position={[0, 2.5, 0]}>
      {children}
    </group>
  )
}

// ============================================
// GROUND GLOW - Circle under coin
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
      <circleGeometry args={[0.8, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </mesh>
  )
}

// ============================================
// SPARKLE PARTICLES around coin
// ============================================
function Sparkles({ color }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.02
    }
  })

  return (
    <group ref={groupRef}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2
        const radius = 0.6
        return (
          <mesh 
            key={i} 
            position={[
              Math.cos(angle) * radius, 
              0, 
              Math.sin(angle) * radius
            ]}
          >
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        )
      })}
    </group>
  )
}

// ============================================
// MAIN COIN COMPONENT
// ============================================
export function Coin({ id, x, z, value, collected }) {
  // Don't render if collected
  if (collected) return null

  // Get config for this coin value
  const config = COIN_CONFIG[value] || COIN_CONFIG[100]
  const { color, emissive, size } = config

  return (
    <group position={[x, 0, z]}>
      {/* Ground glow */}
      <GroundGlow color={color} />

      {/* Animated coin */}
      <AnimatedCoinWrapper id={id}>
        <ProceduralCoin color={color} emissive={emissive} size={size} />
        <Sparkles color={emissive} />
      </AnimatedCoinWrapper>

      {/* Point light to make coin glow */}
      <pointLight
        position={[0, 2.5, 0]}
        color={color}
        intensity={0.5}
        distance={3}
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
