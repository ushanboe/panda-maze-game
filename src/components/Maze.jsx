import { useMemo, useEffect, useState } from 'react'
import { useLoader } from '@react-three/fiber'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'

const CELL_SIZE = 2
const WALL_HEIGHT = 3

// Single bamboo instance using the FBX model
function BambooModel({ position, scale = 0.01, rotation = 0 }) {
  const [model, setModel] = useState(null)
  
  useEffect(() => {
    const loader = new FBXLoader()
    loader.load('/models/bamboo.fbx', (fbx) => {
      fbx.scale.setScalar(scale)
      fbx.rotation.y = rotation
      
      // Apply materials
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          // Enhance the bamboo color if needed
          if (child.material) {
            child.material = new THREE.MeshStandardMaterial({
              color: '#5a8f3e',
              roughness: 0.8,
              metalness: 0.1
            })
          }
        }
      })
      
      setModel(fbx)
    })
  }, [scale, rotation])
  
  if (!model) return null
  
  return <primitive object={model.clone()} position={position} />
}

// Wall made of multiple bamboo models
function BambooWall({ x, z }) {
  // Create a cluster of bamboo for each wall cell
  const bambooPositions = useMemo(() => {
    const positions = []
    const count = 3 // Number of bamboo stalks per wall
    
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const offsetX = (i - count / 2 + 0.5) * (CELL_SIZE / count)
        const offsetZ = (j - count / 2 + 0.5) * (CELL_SIZE / count)
        // Add slight random variation
        const randX = (Math.random() - 0.5) * 0.2
        const randZ = (Math.random() - 0.5) * 0.2
        const randRotation = Math.random() * Math.PI * 2
        const randScale = 0.008 + Math.random() * 0.004 // Vary size slightly
        
        positions.push({
          pos: [x + offsetX + randX, 0, z + offsetZ + randZ],
          rotation: randRotation,
          scale: randScale
        })
      }
    }
    return positions
  }, [x, z])
  
  return (
    <group>
      {bambooPositions.map((bamboo, index) => (
        <BambooModel
          key={index}
          position={bamboo.pos}
          rotation={bamboo.rotation}
          scale={bamboo.scale}
        />
      ))}
    </group>
  )
}

// Optimized version using instanced mesh for better performance
function BambooWallSimple({ x, z }) {
  const [model, setModel] = useState(null)
  
  useEffect(() => {
    const loader = new FBXLoader()
    loader.load('/models/bamboo.fbx', (fbx) => {
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      setModel(fbx)
    })
  }, [])
  
  if (!model) return null
  
  // Clone and position the model
  const clonedModel = model.clone()
  clonedModel.scale.setScalar(0.015)
  clonedModel.position.set(x, 0, z)
  clonedModel.rotation.y = Math.random() * Math.PI * 2
  
  return <primitive object={clonedModel} />
}

export function Maze({ walls, exitPosition }) {
  // Load the bamboo model once
  const [bambooTemplate, setBambooTemplate] = useState(null)
  
  useEffect(() => {
    const loader = new FBXLoader()
    loader.load('/models/bamboo.fbx', (fbx) => {
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          // Green bamboo material
          child.material = new THREE.MeshStandardMaterial({
            color: '#4a7c32',
            roughness: 0.7,
            metalness: 0.1
          })
        }
      })
      setBambooTemplate(fbx)
      console.log('Bamboo model loaded!')
    })
  }, [])
  
  // Generate bamboo positions for all walls
  const bambooInstances = useMemo(() => {
    if (!walls) return []
    
    const instances = []
    walls.forEach((wall, wallIndex) => {
      // Place 2-4 bamboo stalks per wall cell
      const count = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < count; i++) {
        const offsetX = (Math.random() - 0.5) * CELL_SIZE * 0.7
        const offsetZ = (Math.random() - 0.5) * CELL_SIZE * 0.7
        instances.push({
          position: [wall.x + offsetX, 0, wall.z + offsetZ],
          rotation: Math.random() * Math.PI * 2,
          scale: 0.012 + Math.random() * 0.006
        })
      }
    })
    return instances
  }, [walls])
  
  return (
    <group>
      {/* Render bamboo instances */}
      {bambooTemplate && bambooInstances.map((instance, index) => {
        const clone = bambooTemplate.clone()
        clone.scale.setScalar(instance.scale)
        clone.rotation.y = instance.rotation
        return (
          <primitive
            key={index}
            object={clone}
            position={instance.position}
          />
        )
      })}
      
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
