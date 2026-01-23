import { useRef, useMemo, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useGameStore } from '../stores/gameStore'

// Coin configurations
const COIN_CONFIG = {
  100: { model: '/models/silver_coin.glb', scale: 0.6, name: 'Bronze', color: '#cd7f32' },
  250: { model: '/models/silver_coin.glb', scale: 0.7, name: 'Silver', color: '#c0c0c0' },
  500: { model: '/models/gold_coin.glb', scale: 0.7, name: 'Gold', color: '#ffd700' },
  1000: { model: '/models/vcoin.glb', scale: 0.5, name: 'Platinum', color: '#e5e4e2' }
}

// Simple fallback coin (no GLB loading)
function FallbackCoin({ id, x, z, value, color }) {
  const groupRef = useRef()
  const glowRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.05
      groupRef.current.position.y = 1.5 + Math.sin(state.clock.elapsedTime * 2 + id) * 0.2
    }
    if (glowRef.current) {
      const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.2
      glowRef.current.material.opacity = pulse
    }
  })

  return (
    <group position={[x, 0, z]}>
      {/* Glow on ground */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>

      {/* Simple cylinder coin */}
      <group ref={groupRef} position={[0, 1.5, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.8} 
            roughness={0.2}
            emissive={color}
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* Light beam */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

// GLB coin component - only called inside Suspense
function GLBCoin({ id, x, z, value, config }) {
  const groupRef = useRef()
  const glowRef = useRef()

  // Load the GLB model - this is safe because we're inside Suspense
  const { scene } = useGLTF(config.model)
  const coinModel = useMemo(() => scene.clone(), [scene])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.05
      groupRef.current.position.y = 1.5 + Math.sin(state.clock.elapsedTime * 2 + id) * 0.2
    }
    if (glowRef.current) {
      const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.2
      glowRef.current.material.opacity = pulse
    }
  })

  return (
    <group position={[x, 0, z]}>
      {/* Glow on ground */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color={config.color} transparent opacity={0.4} />
      </mesh>

      {/* GLB coin model */}
      <group ref={groupRef} position={[0, 1.5, 0]}>
        <primitive object={coinModel} scale={config.scale} />
      </group>

      {/* Light beam */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshBasicMaterial color={config.color} transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

// Main Coin component with error boundary fallback
export function Coin({ id, x, z, value, collected }) {
  if (collected) return null

  const config = COIN_CONFIG[value] || COIN_CONFIG[100]

  // Use simple fallback coins to avoid GLB loading issues
  return <FallbackCoin id={id} x={x} z={z} value={value} color={config.color} />
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
