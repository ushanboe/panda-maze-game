import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useGameStore } from '../stores/gameStore'

// Preload the treasure chest model
useGLTF.preload('/models/treasure_chest.glb')

// Treasure Chest Component
export function TreasureChest({ type = '10K' }) {
  const groupRef = useRef()

  const treasure10K = useGameStore(state => state.treasure10K)
  const treasure50K = useGameStore(state => state.treasure50K)

  const treasure = type === '10K' ? treasure10K : treasure50K

  // Load the GLB model
  const { scene } = useGLTF('/models/treasure_chest.glb')

  // Clone the scene so each chest has its own instance
  const chestModel = useMemo(() => scene.clone(), [scene])

  // Don't render if collected
  if (treasure.collected) return null

  const { x, z } = treasure

  // Size reduced by 40% - was 0.8/1.2, now 0.48/0.72
  const scale = type === '10K' ? 0.48 : 0.72
  const glowColor = type === '10K' ? '#ffd700' : '#ff00ff'

  return (
    <group position={[x, 0, z]}>
      {/* Floating chest with animation */}
      <FloatingChest
        groupRef={groupRef}
        chestModel={chestModel}
        scale={scale}
        glowColor={glowColor}
      />

      {/* Ground glow - just a circle, no box */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.3} />
      </mesh>

      {/* Particle beam */}
      <ParticleBeam color={glowColor} />
    </group>
  )
}

// Floating animated chest - NO outer glow box
function FloatingChest({ groupRef, chestModel, scale, glowColor }) {
  const innerRef = useRef()

  useFrame((state) => {
    if (innerRef.current) {
      // Float up and down
      innerRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2
      // Gentle rotation
      innerRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3
    }
  })

  return (
    <group ref={groupRef}>
      <group ref={innerRef}>
        {/* The chest model only - no outer glow box */}
        <primitive 
          object={chestModel} 
          scale={scale}
        />
      </group>
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
