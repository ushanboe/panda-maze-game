import { useMemo } from 'react'
import * as THREE from 'three'

const CELL_SIZE = 2
const WALL_HEIGHT = 3

// Bamboo segment component
function BambooSegment({ position, height = WALL_HEIGHT }) {
  return (
    <group position={position}>
      {/* Main bamboo stalk */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.18, height, 8]} />
        <meshStandardMaterial color="#7cb342" />
      </mesh>
      
      {/* Bamboo rings/nodes */}
      {[0.3, 0.6, 0.9].map((t, i) => (
        <mesh key={i} position={[0, (t - 0.5) * height, 0]} castShadow>
          <torusGeometry args={[0.17, 0.03, 8, 16]} />
          <meshStandardMaterial color="#558b2f" />
        </mesh>
      ))}
    </group>
  )
}

// Wall made of multiple bamboo stalks
function BambooWall({ x, z, isEdge }) {
  const bambooCount = 4
  const spacing = CELL_SIZE / bambooCount
  
  return (
    <group position={[x, WALL_HEIGHT / 2, z]}>
      {/* Create a grid of bamboo stalks for each wall cell */}
      {Array.from({ length: bambooCount }).map((_, i) =>
        Array.from({ length: bambooCount }).map((_, j) => {
          const offsetX = (i - bambooCount / 2 + 0.5) * spacing
          const offsetZ = (j - bambooCount / 2 + 0.5) * spacing
          // Add slight random variation
          const randX = (Math.random() - 0.5) * 0.1
          const randZ = (Math.random() - 0.5) * 0.1
          const randHeight = WALL_HEIGHT + (Math.random() - 0.5) * 0.5
          
          return (
            <BambooSegment
              key={`${i}-${j}`}
              position={[offsetX + randX, 0, offsetZ + randZ]}
              height={randHeight}
            />
          )
        })
      )}
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
          isEdge={wall.isEdge}
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
