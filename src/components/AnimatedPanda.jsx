import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function AnimatedPanda({ isMoving, hasWon, scale = 1 }) {
  const groupRef = useRef()
  const bounceRef = useRef(0)
  const wobbleRef = useRef(0)
  
  // Animate the panda
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    if (hasWon) {
      // Happy dance when won!
      wobbleRef.current += delta * 10
      groupRef.current.rotation.y = Math.sin(wobbleRef.current) * 0.3
      groupRef.current.position.y = Math.abs(Math.sin(wobbleRef.current * 2)) * 0.3
    } else if (isMoving) {
      // Cute waddle walk animation
      bounceRef.current += delta * 12
      groupRef.current.position.y = Math.abs(Math.sin(bounceRef.current)) * 0.1
      groupRef.current.rotation.z = Math.sin(bounceRef.current) * 0.08
    } else {
      // Gentle idle breathing
      bounceRef.current += delta * 2
      groupRef.current.position.y = Math.sin(bounceRef.current) * 0.03
      groupRef.current.rotation.z = 0
    }
  })
  
  const s = scale * 100 // Scale multiplier
  
  return (
    <group ref={groupRef} scale={[s, s, s]}>
      {/* === BODY === */}
      {/* Main body - chubby round */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Belly patch - cute round tummy */}
      <mesh position={[0, 0.45, 0.25]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      
      {/* === HEAD === */}
      {/* Big round head - cuter with larger head */}
      <mesh position={[0, 1.05, 0.1]} castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* === EARS === */}
      {/* Left ear - round black */}
      <mesh position={[-0.3, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Left ear inner - pink */}
      <mesh position={[-0.28, 1.38, 0.08]} castShadow>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#ffb6c1" />
      </mesh>
      
      {/* Right ear - round black */}
      <mesh position={[0.3, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Right ear inner - pink */}
      <mesh position={[0.28, 1.38, 0.08]} castShadow>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#ffb6c1" />
      </mesh>
      
      {/* === EYES === */}
      {/* Eye patches - black */}
      <mesh position={[-0.15, 1.1, 0.3]} castShadow>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.15, 1.1, 0.3]} castShadow>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Eyes - big cute white */}
      <mesh position={[-0.14, 1.12, 0.38]} castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.14, 1.12, 0.38]} castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Pupils - shiny black */}
      <mesh position={[-0.13, 1.13, 0.44]} castShadow>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.13, 1.13, 0.44]} castShadow>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* Eye sparkles - cute highlight */}
      <mesh position={[-0.11, 1.15, 0.47]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.15, 1.15, 0.47]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      
      {/* === NOSE & MOUTH === */}
      {/* Nose - small black oval */}
      <mesh position={[0, 0.95, 0.48]} castShadow>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Mouth - cute smile using torus */}
      <mesh position={[0, 0.88, 0.42]} rotation={[0.3, 0, 0]}>
        <torusGeometry args={[0.06, 0.015, 8, 12, Math.PI]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* === BLUSH CHEEKS === */}
      <mesh position={[-0.25, 0.98, 0.35]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial color="#ffb6c1" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.25, 0.98, 0.35]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial color="#ffb6c1" transparent opacity={0.6} />
      </mesh>
      
      {/* === ARMS === */}
      {/* Left arm */}
      <mesh position={[-0.45, 0.5, 0.1]} rotation={[0, 0, 0.5]} castShadow>
        <capsuleGeometry args={[0.12, 0.25, 8, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Right arm */}
      <mesh position={[0.45, 0.5, 0.1]} rotation={[0, 0, -0.5]} castShadow>
        <capsuleGeometry args={[0.12, 0.25, 8, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* === LEGS === */}
      {/* Left leg */}
      <mesh position={[-0.2, 0.12, 0.1]} castShadow>
        <capsuleGeometry args={[0.13, 0.15, 8, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Right leg */}
      <mesh position={[0.2, 0.12, 0.1]} castShadow>
        <capsuleGeometry args={[0.13, 0.15, 8, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* === TAIL === */}
      <mesh position={[0, 0.35, -0.4]} castShadow>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}
