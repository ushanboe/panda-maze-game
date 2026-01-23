import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useGameStore } from '../stores/gameStore'

// Coin configurations - which model to use for each value
const COIN_CONFIG = {
  100: { model: '/models/silver_coin.glb', scale: 0.4, name: 'Bronze' },
  250: { model: '/models/silver_coin.glb', scale: 0.5, name: 'Silver' },
  500: { model: '/models/gold_coin.glb', scale: 0.5, name: 'Gold' },
  1000: { model: '/models/vcoin.glb', scale: 0.3, name: 'Platinum' }
}

// Preload all coin models
Object.values(COIN_CONFIG).forEach(config => {
  useGLTF.preload(config.model)
})

export function Coin({ id, x, z, value, collected }) {
  const groupRef = useRef()
  const glowRef = useRef()

  const config = COIN_CONFIG[value] || COIN_CONFIG[100]

  // Load the GLB model
  const { scene } = useGLTF(config.model)

  // Clone the scene so each coin has its own instance
  const coinModel = useMemo(() => scene.clone(), [scene])

  // Animation - spin and bob
  useFrame((state) => {
    if (groupRef.current && !collected) {
      // Spin the coin
      groupRef.current.rotation.y += 0.05
      // Bob up and down
      groupRef.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 2 + id) * 0.15
    }
    if (glowRef.current && !collected) {
      // Pulse glow
      const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.2
      glowRef.current.material.opacity = pulse
    }
  })

  if (collected) return null

  // Glow color based on coin type
  const glowColor = value >= 500 ? '#ffd700' : '#c0c0c0'

  return (
    <group position={[x, 0, z]}>
      {/* Glow effect on ground */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* The coin model */}
      <group ref={groupRef} position={[0, 1, 0]}>
        <primitive 
          object={coinModel} 
          scale={config.scale}
        />
      </group>
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
