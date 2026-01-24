import { useRef, useMemo, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useGameStore } from '../stores/gameStore'
import { ErrorBoundary } from './ErrorBoundary'

// Preload all coin models at module level
useGLTF.preload('/models/silver_coin.glb')
useGLTF.preload('/models/gold_coin.glb')
useGLTF.preload('/models/vcoin.glb')

// ============================================
// FALLBACK COIN - Simple geometry, always works
// ============================================
function FallbackCoin({ color = '#ffd700' }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  )
}

// ============================================
// GLB COIN MODELS - Each loads one specific model
// useGLTF is at TOP LEVEL - unconditional!
// Added rotation to orient coins properly (they're flat on XY plane in GLB)
// ============================================
function SilverCoinModel({ scale }) {
  const { scene } = useGLTF('/models/silver_coin.glb')
  const cloned = useMemo(() => {
    const clone = scene.clone()
    // Traverse and ensure materials are properly set up
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [scene])
  // Rotate 90 degrees on X to stand the coin up (it's flat in the GLB)
  return <primitive object={cloned} scale={scale} rotation={[Math.PI / 2, 0, 0]} />
}

function GoldCoinModel({ scale }) {
  const { scene } = useGLTF('/models/gold_coin.glb')
  const cloned = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [scene])
  return <primitive object={cloned} scale={scale} rotation={[Math.PI / 2, 0, 0]} />
}

function PlatinumCoinModel({ scale }) {
  const { scene } = useGLTF('/models/vcoin.glb')
  const cloned = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [scene])
  return <primitive object={cloned} scale={scale} rotation={[Math.PI / 2, 0, 0]} />
}

// ============================================
// COIN CONFIGURATIONS
// Increased scales since GLB models are ~2.3 units diameter
// ============================================
const COIN_CONFIG = {
  100: { name: 'Bronze', color: '#cd7f32', scale: 0.3, Model: SilverCoinModel },
  250: { name: 'Silver', color: '#c0c0c0', scale: 0.35, Model: SilverCoinModel },
  500: { name: 'Gold', color: '#ffd700', scale: 0.35, Model: GoldCoinModel },
  1000: { name: 'Platinum', color: '#e5e4e2', scale: 0.25, Model: PlatinumCoinModel }
}

// ============================================
// ANIMATED COIN WRAPPER - Handles spin & float
// ============================================
function AnimatedCoinWrapper({ children, id }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      // Spin
      groupRef.current.rotation.y += 0.05
      // Float up and down
      groupRef.current.position.y = 1.5 + Math.sin(state.clock.elapsedTime * 2 + id) * 0.2
    }
  })

  return (
    <group ref={groupRef} position={[0, 1.5, 0]}>
      {children}
    </group>
  )
}

// ============================================
// GROUND GLOW - Circle under coin
// ============================================
function GroundGlow({ color }) {
  const glowRef = useRef()

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.15
      glowRef.current.material.opacity = pulse
    }
  })

  return (
    <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <circleGeometry args={[0.8, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </mesh>
  )
}

// ============================================
// MAIN COIN COMPONENT
// ============================================
export function Coin({ id, x, z, value, collected }) {
  // Don't render if collected
  if (collected) return null

  // Get config for this coin value
  const config = COIN_CONFIG[value] || COIN_CONFIG[100]
  const { color, scale, Model } = config

  return (
    <group position={[x, 0, z]}>
      {/* Ground glow - always renders */}
      <GroundGlow color={color} />

      {/* Animated coin with GLB model */}
      <AnimatedCoinWrapper id={id}>
        <ErrorBoundary fallback={<FallbackCoin color={color} />}>
          <Suspense fallback={<FallbackCoin color={color} />}>
            <Model scale={scale} />
          </Suspense>
        </ErrorBoundary>
      </AnimatedCoinWrapper>
    </group>
  )
}

// ============================================
// COINS CONTAINER - Renders all coins from store
// ============================================
export function Coins() {
  const coins = useGameStore((state) => state.coins)

  if (!coins || coins.length === 0) {
    return null
  }

  return (
    <>
      {coins.map((coin) => (
        <Coin key={coin.id} {...coin} />
      ))}
    </>
  )
}
