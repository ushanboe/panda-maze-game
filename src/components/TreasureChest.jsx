import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import { SoundManager } from '../utils/SoundManager'

// Treasure Chest Component
export function TreasureChest({ type = '10K' }) {
  const meshRef = useRef()
  const [exploding, setExploding] = useState(false)
  const [particles, setParticles] = useState([])

  const treasure10K = useGameStore(state => state.treasure10K)
  const treasure50K = useGameStore(state => state.treasure50K)

  const treasure = type === '10K' ? treasure10K : treasure50K
  const value = type === '10K' ? 10000 : 50000

  // Don't render if collected or (for 50K) not visible yet
  if (treasure.collected) return null
  if (type === '50K' && !treasure.visible) return null

  const { x, z } = treasure

  // Colors based on type
  const chestColor = type === '10K' ? '#ffd700' : '#ff00ff'
  const glowColor = type === '10K' ? '#ffaa00' : '#ff66ff'
  const size = type === '10K' ? 0.6 : 0.8

  return (
    <group position={[x, 0, z]}>
      {/* Floating chest */}
      <FloatingChest 
        meshRef={meshRef}
        color={chestColor}
        glowColor={glowColor}
        size={size}
        value={value}
        type={type}
      />

      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[size * 2, 32]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.3} />
      </mesh>

      {/* Particle beam */}
      <ParticleBeam color={glowColor} />
    </group>
  )
}

// Floating animated chest
function FloatingChest({ meshRef, color, glowColor, size, value, type }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      // Float up and down
      groupRef.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2
      // Gentle rotation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3
    }
  })

  return (
    <group ref={groupRef}>
      {/* Outer glow */}
      <mesh>
        <boxGeometry args={[size * 1.8, size * 1.4, size * 1.4]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.2} />
      </mesh>

      {/* Chest body */}
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[size * 1.2, size * 0.8, size * 0.8]} />
        <meshStandardMaterial
          color={color}
          emissive={glowColor}
          emissiveIntensity={0.5}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Chest lid */}
      <mesh position={[0, size * 0.5, 0]} castShadow>
        <boxGeometry args={[size * 1.3, size * 0.3, size * 0.9]} />
        <meshStandardMaterial
          color={color}
          emissive={glowColor}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Lock/decoration */}
      <mesh position={[0, size * 0.2, size * 0.45]}>
        <boxGeometry args={[size * 0.3, size * 0.3, size * 0.1]} />
        <meshStandardMaterial
          color="#8b4513"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Value indicator - floating text substitute */}
      <mesh position={[0, size * 1.2, 0]}>
        <torusGeometry args={[size * 0.4, size * 0.08, 8, 32]} />
        <meshBasicMaterial color={type === '10K' ? '#ffffff' : '#ffff00'} />
      </mesh>
    </group>
  )
}

// Particle beam effect
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
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[0, 2, 0]} rotation={[0, (Math.PI / 2) * i, 0]}>
          <planeGeometry args={[0.1, 4]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} side={2} />
        </mesh>
      ))}
    </group>
  )
}

// Explosion particles (shown when collected)
export function ExplosionParticles({ position, color, onComplete }) {
  const [particles] = useState(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      velocity: [
        (Math.random() - 0.5) * 5,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 5
      ],
      size: Math.random() * 0.2 + 0.1
    }))
  )

  const groupRef = useRef()
  const [opacity, setOpacity] = useState(1)

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const p = particles[i]
        child.position.x += p.velocity[0] * delta
        child.position.y += p.velocity[1] * delta
        child.position.z += p.velocity[2] * delta
        p.velocity[1] -= 9.8 * delta // Gravity
      })
      setOpacity(prev => {
        const newOpacity = prev - delta
        if (newOpacity <= 0 && onComplete) onComplete()
        return Math.max(0, newOpacity)
      })
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {particles.map(p => (
        <mesh key={p.id}>
          <boxGeometry args={[p.size, p.size, p.size]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  )
}
