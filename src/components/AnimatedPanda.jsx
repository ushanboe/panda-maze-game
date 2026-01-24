import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'

export function AnimatedPanda({ isMoving, hasWon, scale = 0.007 }) {
  const groupRef = useRef()
  const playerCaught = useGameStore(state => state.playerCaught)

  useFrame((state, delta) => {
    if (!groupRef.current) return

    // Bobbing animation when moving
    if (isMoving && !hasWon && !playerCaught) {
      groupRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 0.15
    } else if (!hasWon && !playerCaught) {
      groupRef.current.position.y = 0
    }

    // Win celebration
    if (hasWon) {
      groupRef.current.rotation.y += delta * 5
      groupRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.5
    }

    // Caught animation
    if (playerCaught) {
      groupRef.current.rotation.y += delta * 15
      const currentScale = groupRef.current.scale.x
      if (currentScale > 0.01) {
        groupRef.current.scale.multiplyScalar(0.96)
      }
      groupRef.current.position.y += delta * 2
    }
  })

  // Scale factor - 3x bigger than before
  const s = 3

  return (
    <group ref={groupRef} scale={[s, s, s]}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.2, 1.25, 0]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.2, 1.25, 0]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Eye patches (black) */}
      <mesh position={[-0.12, 1.05, 0.2]} castShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.12, 1.05, 0.2]} castShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Eyes (white) */}
      <mesh position={[-0.1, 1.07, 0.28]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.1, 1.07, 0.28]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.1, 1.07, 0.32]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.1, 1.07, 0.32]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 0.95, 0.28]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.45, 0.5, 0]} rotation={[0, 0, 0.3]} castShadow>
        <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.45, 0.5, 0]} rotation={[0, 0, -0.3]} castShadow>
        <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.2, 0.1, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.2, 4, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.2, 0.1, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.2, 4, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )
}
