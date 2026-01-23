import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import { SoundManager } from '../utils/SoundManager'

// Coin colors based on value
const COIN_STYLES = {
  100: { color: '#cd7f32', emissive: '#8b4513', size: 0.3, name: 'Bronze' },
  250: { color: '#c0c0c0', emissive: '#808080', size: 0.35, name: 'Silver' },
  500: { color: '#ffd700', emissive: '#daa520', size: 0.4, name: 'Gold' },
  1000: { color: '#e5e4e2', emissive: '#b4eeb4', size: 0.45, name: 'Platinum' }
}

export function Coin({ id, x, z, value, collected }) {
  const meshRef = useRef()
  const glowRef = useRef()

  const style = COIN_STYLES[value] || COIN_STYLES[100]

  // Animation
  useFrame((state) => {
    if (meshRef.current && !collected) {
      // Spin
      meshRef.current.rotation.y += 0.05
      // Bob up and down
      meshRef.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 2 + id) * 0.15
    }
    if (glowRef.current && !collected) {
      // Pulse glow
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3
      glowRef.current.material.opacity = pulse
    }
  })

  if (collected) return null

  return (
    <group position={[x, 1, z]}>
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[style.size * 1.5, 16, 16]} />
        <meshBasicMaterial 
          color={style.color} 
          transparent 
          opacity={0.3}
        />
      </mesh>

      {/* Coin */}
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[style.size, style.size, 0.08, 32]} />
        <meshStandardMaterial
          color={style.color}
          emissive={style.emissive}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Value text (using a simple ring indicator) */}
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 4, 0, 0]}>
        <ringGeometry args={[style.size * 0.6, style.size * 0.8, 32]} />
        <meshBasicMaterial color={style.color} transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

// Component to render all coins
export function Coins() {
  const coins = useGameStore(state => state.coins)

  return (
    <>
      {coins.map(coin => (
        <Coin key={coin.id} {...coin} />
      ))}
    </>
  )
}
