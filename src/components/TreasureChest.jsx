
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'

// ============================================
// TREASURE CRYSTAL CONFIGURATIONS
// ============================================
const TREASURE_CONFIG = {
  10000: {
    color: '#00ff88',
    emissive: '#006633',
    size: 1.2,
    name: 'Emerald Crystal (10K)'
  },
  50000: {
    color: '#ffdd00',
    emissive: '#665500',
    size: 1.8,
    name: 'Golden Crystal (50K)'
  }
}

// ============================================
// LARGE PROCEDURAL CRYSTAL - Multi-faceted gem
// ============================================
function LargeCrystal({ color, emissive, size }) {
  return (
    <group>
      {/* Main crystal spire */}
      <mesh position={[0, size * 0.6, 0]} castShadow>
        <coneGeometry args={[size * 0.5, size * 1.5, 8]} />
        <meshStandardMaterial
          color={color}
          metalness={0.4}
          roughness={0.1}
          emissive={emissive}
          emissiveIntensity={1.0}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Bottom base */}
      <mesh position={[0, -size * 0.2, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[size * 0.5, size * 0.5, 8]} />
        <meshStandardMaterial
          color={color}
          metalness={0.4}
          roughness={0.1}
          emissive={emissive}
          emissiveIntensity={1.0}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Side crystals */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2
        return (
          <mesh 
            key={i}
            position={[
              Math.cos(angle) * size * 0.4,
              size * 0.2,
              Math.sin(angle) * size * 0.4
            ]}
            rotation={[0.3, angle, 0.2]}
            castShadow
          >
            <coneGeometry args={[size * 0.2, size * 0.7, 6]} />
            <meshStandardMaterial
              color={color}
              metalness={0.4}
              roughness={0.1}
              emissive={emissive}
              emissiveIntensity={0.8}
              transparent
              opacity={0.8}
            />
          </mesh>
        )
      })}
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[size * 0.3, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

// ============================================
// ANIMATED TREASURE - Rotation & float
// ============================================
function AnimatedTreasure({ children, id }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.025
      groupRef.current.position.y = 2.5 + Math.sin(state.clock.elapsedTime * 1.5 + id) * 0.35
    }
  })

  return (
    <group ref={groupRef} position={[0, 2.5, 0]}>
      {children}
    </group>
  )
}

// ============================================
// GROUND GLOW
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
// SPARKLE RING
// ============================================
function SparkleRing({ color }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.05
    }
  })

  return (
    <group ref={groupRef} position={[0, 2.5, 0]}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 1.5, Math.sin(i) * 0.4, Math.sin(angle) * 1.5]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        )
      })}
    </group>
  )
}

// ============================================
// MAIN TREASURE COMPONENT
// ============================================
export function TreasureChest({ id, x, z, value, collected }) {
  if (collected) return null

  const config = TREASURE_CONFIG[value] || TREASURE_CONFIG[10000]
  const { color, emissive, size } = config

  return (
    <group position={[x, 0, z]}>
      <GroundGlow color={color} />
      <AnimatedTreasure id={id}>
        <LargeCrystal color={color} emissive={emissive} size={size} />
      </AnimatedTreasure>
      <SparkleRing color={color} />
      <pointLight position={[0, 2.5, 0]} color={color} intensity={1.2} distance={6} />
    </group>
  )
}

// ============================================
// TREASURE CHESTS CONTAINER
// ============================================
export function TreasureChests() {
  const treasures = useGameStore((state) => state.treasures)
  if (!treasures || treasures.length === 0) return null

  return (
    <>
      {treasures.map((treasure) => (
        <TreasureChest key={treasure.id} {...treasure} />
      ))}
    </>
  )
}
