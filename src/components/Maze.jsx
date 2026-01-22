import { useMemo } from 'react'
import * as THREE from 'three'

const CELL_SIZE = 2
const WALL_HEIGHT = 3

// Low-poly leaf component
function BambooLeaf({ position, rotation, scale = 1 }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Simple elongated diamond/leaf shape */}
      <mesh castShadow>
        <coneGeometry args={[0.15 * scale, 0.6 * scale, 4, 1]} />
        <meshStandardMaterial 
          color="#228b22" 
          side={THREE.DoubleSide}
          flatShading={true}
        />
      </mesh>
    </group>
  )
}

// Leaf cluster - multiple leaves sprouting from a point
function LeafCluster({ position, count = 3 }) {
  const leaves = useMemo(() => {
    const result = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const tilt = Math.PI / 4 + Math.random() * 0.3
      const leafScale = 0.8 + Math.random() * 0.4
      result.push({
        rotation: [tilt, angle, 0],
        scale: leafScale
      })
    }
    return result
  }, [count])
  
  return (
    <group position={position}>
      {leaves.map((leaf, i) => (
        <BambooLeaf 
          key={i} 
          position={[0, 0, 0]} 
          rotation={leaf.rotation}
          scale={leaf.scale}
        />
      ))}
    </group>
  )
}

// Bamboo segment component with leaves
function BambooSegment({ position, height = WALL_HEIGHT }) {
  // Generate random leaf positions along the stalk
  const leafPositions = useMemo(() => {
    const positions = []
    const leafCount = 2 + Math.floor(Math.random() * 2) // 2-3 leaf clusters
    for (let i = 0; i < leafCount; i++) {
      const y = (0.4 + Math.random() * 0.5) * height - height/2 // Upper portion
      positions.push(y)
    }
    return positions
  }, [height])
  
  return (
    <group position={position}>
      {/* Main bamboo stalk */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.15, height, 8]} />
        <meshStandardMaterial color="#7cb342" flatShading={true} />
      </mesh>
      
      {/* Bamboo rings/nodes */}
      {[0.25, 0.5, 0.75].map((t, i) => (
        <mesh key={i} position={[0, (t - 0.5) * height, 0]} castShadow>
          <torusGeometry args={[0.14, 0.025, 6, 12]} />
          <meshStandardMaterial color="#558b2f" flatShading={true} />
        </mesh>
      ))}
      
      {/* Leaf clusters */}
      {leafPositions.map((y, i) => (
        <LeafCluster 
          key={i} 
          position={[0, y, 0]} 
          count={2 + Math.floor(Math.random() * 2)}
        />
      ))}
      
      {/* Top leaves */}
      <LeafCluster 
        position={[0, height/2 - 0.1, 0]} 
        count={4}
      />
    </group>
  )
}

// Wall made of multiple bamboo stalks
function BambooWall({ x, z }) {
  const bambooStalks = useMemo(() => {
    const stalks = []
    const count = 3 // 3x3 grid of bamboo
    const spacing = CELL_SIZE / count
    
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const offsetX = (i - count / 2 + 0.5) * spacing
        const offsetZ = (j - count / 2 + 0.5) * spacing
        // Add slight random variation
        const randX = (Math.random() - 0.5) * 0.15
        const randZ = (Math.random() - 0.5) * 0.15
        const randHeight = WALL_HEIGHT + (Math.random() - 0.5) * 0.8
        
        stalks.push({
          position: [offsetX + randX, 0, offsetZ + randZ],
          height: randHeight
        })
      }
    }
    return stalks
  }, [])
  
  return (
    <group position={[x, WALL_HEIGHT / 2, z]}>
      {bambooStalks.map((stalk, index) => (
        <BambooSegment
          key={index}
          position={stalk.position}
          height={stalk.height}
        />
      ))}
    </group>
  )
}

export function Maze({ walls, exitPosition }) {
  return (
    <group>
      {/* Render all walls */}
      {walls.map((wall, index) => (
        <BambooWall
          key={index}
          x={wall.x}
          z={wall.z}
        />
      ))}
      
      {/* Exit marker - glowing green portal */}
      <group position={[exitPosition.x, 0, exitPosition.z]}>
        <mesh position={[0, 1.5, 0]}>
          <torusGeometry args={[1, 0.1, 16, 32]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={0.5}
          />
        </mesh>
        <pointLight
          position={[0, 1.5, 0]}
          color="#00ff88"
          intensity={2}
          distance={5}
        />
      </group>
    </group>
  )
}
