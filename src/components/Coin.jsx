import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useGameStore } from '../stores/gameStore'

// Coin configurations - which model to use for each value
const COIN_CONFIG = {
  100: { model: '/models/silver_coin.glb', scale: 0.6, name: 'Bronze', color: '#cd7f32' },
  250: { model: '/models/silver_coin.glb', scale: 0.7, name: 'Silver', color: '#c0c0c0' },
  500: { model: '/models/gold_coin.glb', scale: 0.7, name: 'Gold', color: '#ffd700' },
  1000: { model: '/models/vcoin.glb', scale: 0.5, name: 'Platinum', color: '#e5e4e2' }
}

// Preload all coin models
Object.values(COIN_CONFIG).forEach(config => {
  useGLTF.preload(config.model)
})

export function Coin({ id, x, z, value, collected }) {
  const groupRef = useRef()
  const glowRef = useRef()

  const config = COIN_CONFIG[value] || COIN_CONFIG[100]

  // Load the GLB model with error handling
  let coinModel = null
  try {
    const { scene } = useGLTF(config.model)
    // Clone the scene so each coin has its own instance
    coinModel = useMemo(() => scene.clone(), [scene])
  } catch (e) {
    console.warn('Failed to load coin model:', config.model)
  }

  // Animation - spin and bob - RAISED to Y=1.5
  useFrame((state) => {
    if (groupRef.current && !collected) {
      // Spin the coin
      groupRef.current.rotation.y += 0.05
      // Bob up and down - raised base height to 1.5
      groupRef.current.position.y = 1.5 + Math.sin(state.clock.elapsedTime * 2 + id) * 0.2
    }
    if (glowRef.current && !collected) {
      // Pulse glow
      const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.2
      glowRef.current.material.opacity = pulse
    }
  })

  if (collected) return null

  // Glow color based on coin type
  const glowColor = config.color

  return (
    <group position={[x, 0, z]}>
      {/* Glow effect on ground */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* The coin - either GLB model or fallback cylinder */}
      <group ref={groupRef} position={[0, 1.5, 0]}>
        {coinModel ? (
          <primitive
            object={coinModel}
            scale={config.scale}
          />
        ) : (
          /* Fallback: simple cylinder coin if model fails to load */
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
            <meshStandardMaterial 
              color={config.color} 
              metalness={0.8} 
              roughness={0.2}
              emissive={config.color}
              emissiveIntensity={0.3}
            />
          </mesh>
        )}
      </group>

      {/* Vertical light beam for visibility */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.3} />
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
