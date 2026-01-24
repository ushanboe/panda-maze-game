
import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useFBX } from '@react-three/drei'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js'

// Fix Mixamo bone names - remove colons from track names
function fixMixamoBoneNames(clip) {
  clip.tracks.forEach(track => {
    track.name = track.name.replace(/mixamorig:/g, 'mixamorig')
  })
  return clip
}

// Procedural panda (used as permanent fallback - no FBX)
export function AnimatedPanda({ isMoving, hasWon, scale = 1 }) {
  const groupRef = useRef()
  const bounceRef = useRef(0)
  const wobbleRef = useRef(0)

  useFrame((state, delta) => {
    if (!groupRef.current) return

    if (hasWon) {
      wobbleRef.current += delta * 10
      groupRef.current.rotation.y = Math.sin(wobbleRef.current) * 0.3
      groupRef.current.position.y = Math.abs(Math.sin(wobbleRef.current * 2)) * 0.3
    } else if (isMoving) {
      bounceRef.current += delta * 12
      groupRef.current.position.y = Math.abs(Math.sin(bounceRef.current)) * 0.1
      groupRef.current.rotation.z = Math.sin(bounceRef.current) * 0.06
    } else {
      bounceRef.current += delta * 2
      groupRef.current.position.y = Math.sin(bounceRef.current) * 0.03
      groupRef.current.rotation.z = 0
    }
  })

  const s = 1.8  // Good size for maze

  return (
    <group ref={groupRef} scale={[s, s, s]}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Belly */}
      <mesh position={[0, 0.45, 0.2]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.0, 0.08]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.25, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.25, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Eye patches */}
      <mesh position={[-0.12, 1.05, 0.25]} castShadow>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.12, 1.05, 0.25]} castShadow>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.11, 1.07, 0.32]} castShadow>
        <sphereGeometry args={[0.065, 12, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.11, 1.07, 0.32]} castShadow>
        <sphereGeometry args={[0.065, 12, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.1, 1.08, 0.37]} castShadow>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.1, 1.08, 0.37]} castShadow>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 0.92, 0.4]} castShadow>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.35, 0.5, 0.08]} rotation={[0, 0, 0.4]} castShadow>
        <capsuleGeometry args={[0.09, 0.2, 8, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.35, 0.5, 0.08]} rotation={[0, 0, -0.4]} castShadow>
        <capsuleGeometry args={[0.09, 0.2, 8, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.15, 0.12, 0.08]} castShadow>
        <capsuleGeometry args={[0.1, 0.12, 8, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.15, 0.12, 0.08]} castShadow>
        <capsuleGeometry args={[0.1, 0.12, 8, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )
}
