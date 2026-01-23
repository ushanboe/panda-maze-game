import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'

// Simple Treasure Chest using basic geometry (no GLB to avoid loading issues)
export function TreasureChest({ type = '10K' }) {
  const groupRef = useRef()
  const innerRef = useRef()

  const treasure10K = useGameStore(state => state.treasure10K)
  const treasure50K = useGameStore(state => state.treasure50K)

  const treasure = type === '10K' ? treasure10K : treasure50K

  // Don't render if collected or not visible
  if (treasure.collected || !treasure.visible) return null

  const { x, z } = treasure

  // Size reduced by 40%
  const scale = type === '10K' ? 0.6 : 0.9
  const glowColor = type === '10K' ? '#ffd700' : '#ff00ff'
  const chestColor = type === '10K' ? '#8B4513' : '#4B0082'

  // Animation
  useFrame((state) => {
    if (innerRef.current) {
      // Float up and down
      innerRef.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2
      // Gentle rotation
      innerRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3
    }
  })

  return (
    <group position={[x, 0, z]} ref={groupRef}>
      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.4} />
      </mesh>

      {/* Floating chest */}
      <group ref={innerRef} position={[0, 0.8, 0]}>
        {/* Chest base (box) */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2 * scale, 0.8 * scale, 0.8 * scale]} />
          <meshStandardMaterial color={chestColor} metalness={0.3} roughness={0.7} />
        </mesh>

        {/* Chest lid (slightly open) */}
        <mesh position={[0, 0.5 * scale, -0.2 * scale]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[1.2 * scale, 0.2 * scale, 0.8 * scale]} />
          <meshStandardMaterial color={chestColor} metalness={0.3} roughness={0.7} />
        </mesh>

        {/* Gold trim */}
        <mesh position={[0, 0.1 * scale, 0.41 * scale]}>
          <boxGeometry args={[1.0 * scale, 0.15 * scale, 0.05 * scale]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Lock */}
        <mesh position={[0, 0.2 * scale, 0.42 * scale]}>
          <boxGeometry args={[0.15 * scale, 0.2 * scale, 0.05 * scale]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Glowing coins inside */}
        <mesh position={[0, 0.3 * scale, 0]}>
          <sphereGeometry args={[0.3 * scale, 16, 16]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
      </group>

      {/* Particle beam */}
      <ParticleBeam color={glowColor} />
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
