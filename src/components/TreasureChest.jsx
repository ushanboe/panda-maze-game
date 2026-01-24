
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../stores/gameStore'

// ============================================
// TREASURE CHEST CONFIGURATIONS
// ============================================
const CHEST_CONFIG = {
  10000: {
    name: 'Silver Chest',
    bodyColor: '#8b4513',
    metalColor: '#c0c0c0',
    glowColor: '#87ceeb',
    scale: 0.8
  },
  50000: {
    name: 'Gold Chest',
    bodyColor: '#5c3317',
    metalColor: '#ffd700',
    glowColor: '#ff8c00',
    scale: 1.0
  }
}

// ============================================
// PROCEDURAL TREASURE CHEST
// ============================================
function ProceduralChest({ bodyColor, metalColor, glowColor, scale }) {
  return (
    <group scale={scale}>
      {/* Main chest body */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.2, 0.8, 0.8]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Chest lid (slightly open) */}
      <mesh position={[0, 0.85, -0.15]} rotation={[-0.3, 0, 0]} castShadow>
        <boxGeometry args={[1.2, 0.15, 0.8]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Metal bands on body */}
      {[-0.35, 0, 0.35].map((xPos, i) => (
        <mesh key={i} position={[xPos, 0.4, 0.41]} castShadow>
          <boxGeometry args={[0.08, 0.75, 0.02]} />
          <meshStandardMaterial
            color={metalColor}
            metalness={0.9}
            roughness={0.1}
            emissive={metalColor}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* Metal lock plate */}
      <mesh position={[0, 0.5, 0.42]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.02]} />
        <meshStandardMaterial
          color={metalColor}
          metalness={0.95}
          roughness={0.05}
          emissive={metalColor}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Glowing treasure inside (visible through open lid) */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>

      {/* Coins spilling out */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI
        const dist = 0.3 + Math.random() * 0.2
        return (
          <mesh 
            key={i} 
            position={[
              Math.cos(angle) * dist,
              0.65 + i * 0.05,
              Math.sin(angle) * dist * 0.5
            ]}
            rotation={[Math.PI / 2, 0, angle]}
          >
            <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
            <meshStandardMaterial
              color={metalColor}
              metalness={0.95}
              roughness={0.05}
              emissive={metalColor}
              emissiveIntensity={0.6}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ============================================
// ANIMATED CHEST WRAPPER
// Height raised to 1.5 so player can see it
// ============================================
function AnimatedChestWrapper({ children, id }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle float
      groupRef.current.position.y = 1.5 + Math.sin(state.clock.elapsedTime * 1.5 + id) * 0.15
      // Slow rotation
      groupRef.current.rotation.y += 0.01
    }
  })

  return (
    <group ref={groupRef} position={[0, 1.5, 0]}>
      {children}
    </group>
  )
}

// ============================================
// GROUND GLOW - Large circle under chest
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
      <circleGeometry args={[1.5, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} />
    </mesh>
  )
}

// ============================================
// SPARKLE RING around chest
// ============================================
function SparkleRing({ color }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.03
    }
  })

  return (
    <group ref={groupRef} position={[0, 1.5, 0]}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2
        const radius = 1.2
        return (
          <mesh 
            key={i} 
            position={[
              Math.cos(angle) * radius, 
              Math.sin(i * 0.5) * 0.3, 
              Math.sin(angle) * radius
            ]}
          >
            <sphereGeometry args={[0.05, 8, 8]} />
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

  // Get config for this chest value
  const config = CHEST_CONFIG[value] || CHEST_CONFIG[10000]
  const { bodyColor, metalColor, glowColor, scale } = config

  return (
    <group position={[x, 0, z]}>
      {/* Ground glow */}
      <GroundGlow color={glowColor} />

      {/* Animated chest */}
      <AnimatedChestWrapper id={id}>
        <ProceduralChest 
          bodyColor={bodyColor} 
          metalColor={metalColor} 
          glowColor={glowColor}
          scale={scale}
        />
      </AnimatedChestWrapper>

      {/* Sparkle ring */}
      <SparkleRing color={glowColor} />

      {/* Point light to make chest glow */}
      <pointLight
        position={[0, 2, 0]}
        color={glowColor}
        intensity={1}
        distance={5}
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
