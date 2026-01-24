
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'

// ============================================
// CRYSTAL CONFIGURATIONS - Beautiful colors
// ============================================
const CRYSTAL_CONFIG = {
  100: { 
    color: '#00ffff',
    emissive: '#006666',
    size: 0.4,
    name: 'Cyan Crystal'
  },
  250: { 
    color: '#ff00ff',
    emissive: '#660066',
    size: 0.5,
    name: 'Magenta Crystal'
  },
  500: { 
    color: '#ff8800',
    emissive: '#663300',
    size: 0.6,
    name: 'Orange Crystal'
  },
  1000: { 
    color: '#ff0066',
    emissive: '#660033',
    size: 0.7,
    name: 'Pink Crystal'
  }
}

// ============================================
// PROCEDURAL CRYSTAL - Diamond/gem shape
// ============================================
function ProceduralCrystal({ color, emissive, size }) {
  return (
    <group>
      {/* Top pyramid */}
      <mesh position={[0, size * 0.5, 0]} castShadow>
        <coneGeometry args={[size * 0.6, size * 1.2, 6]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.1}
          emissive={emissive}
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Bottom pyramid (inverted) */}
      <mesh position={[0, -size * 0.3, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[size * 0.6, size * 0.6, 6]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.1}
          emissive={emissive}
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Inner glow core */}
      <mesh>
        <sphereGeometry args={[size * 0.25, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

// ============================================
// ANIMATED CRYSTAL - Rotation & float at head height
// ============================================
function AnimatedCrystal({ children, id }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      // Rotate
      groupRef.current.rotation.y += 0.04
      // Float at head height (2.5)
      groupRef.current.position.y = 2.5 + Math.sin(state.clock.elapsedTime * 2 + id) * 0.25
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
  if (collected) return null

  const config = CRYSTAL_CONFIG[value] || CRYSTAL_CONFIG[100]
  const { color, emissive, size } = config

  return (
    <group position={[x, 0, z]}>
      <GroundGlow color={color} />
      <AnimatedCrystal id={id}>
        <ProceduralCrystal color={color} emissive={emissive} size={size} />
      </AnimatedCrystal>
      <pointLight position={[0, 2.5, 0]} color={color} intensity={0.6} distance={4} />
    </group>
  )
}

// ============================================
// COINS CONTAINER
// ============================================
export function Coins() {
  const coins = useGameStore((state) => state.coins)
  if (!coins || coins.length === 0) return null

  return (
    <>
      {coins.map((coin) => (
        <Coin key={coin.id} {...coin} />
      ))}
    </>
  )
}
