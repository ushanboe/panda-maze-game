import { useMemo, useEffect, useState } from 'react'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import * as THREE from 'three'

const CELL_SIZE = 2
const WALL_HEIGHT = 3

export function Maze({ walls, exitPosition }) {
  const [bambooTemplate, setBambooTemplate] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)
  
  useEffect(() => {
    const loader = new FBXLoader()
    loader.load('/models/bamboo.fbx', (fbx) => {
      // Calculate bounding box to understand model size
      const box = new THREE.Box3().setFromObject(fbx)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      
      console.log('=== BAMBOO MODEL INFO ===')
      console.log('Size:', size)
      console.log('Center:', center)
      console.log('Min:', box.min)
      console.log('Max:', box.max)
      
      setModelInfo({ size, center, box })
      
      // Apply materials and shadows
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          child.material = new THREE.MeshStandardMaterial({
            color: '#4a7c32',
            roughness: 0.7,
            metalness: 0.1
          })
        }
      })
      
      setBambooTemplate(fbx)
      console.log('Bamboo model loaded successfully!')
    }, 
    (progress) => {
      console.log('Loading bamboo:', (progress.loaded / progress.total * 100) + '%')
    },
    (error) => {
      console.error('Error loading bamboo:', error)
    })
  }, [])
  
  // Calculate appropriate scale based on model size
  const bambooScale = useMemo(() => {
    if (!modelInfo) return 0.01
    // We want bamboo to be about WALL_HEIGHT tall (3 units)
    const targetHeight = WALL_HEIGHT
    const currentHeight = modelInfo.size.y
    const scale = targetHeight / currentHeight
    console.log('Calculated scale:', scale, 'from height:', currentHeight)
    return scale
  }, [modelInfo])
  
  // Generate bamboo positions for all walls
  const bambooInstances = useMemo(() => {
    if (!walls) return []
    
    const instances = []
    walls.forEach((wall) => {
      // Place 2-3 bamboo stalks per wall cell
      const count = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < count; i++) {
        const offsetX = (Math.random() - 0.5) * CELL_SIZE * 0.6
        const offsetZ = (Math.random() - 0.5) * CELL_SIZE * 0.6
        instances.push({
          position: [wall.x + offsetX, 0, wall.z + offsetZ],
          rotation: Math.random() * Math.PI * 2,
          scaleVar: 0.8 + Math.random() * 0.4 // 80% to 120% of base scale
        })
      }
    })
    console.log('Created', instances.length, 'bamboo instances')
    return instances
  }, [walls])
  
  return (
    <group>
      {/* Debug: Show wall positions with simple boxes if bamboo not loaded */}
      {!bambooTemplate && walls.map((wall, index) => (
        <mesh key={`debug-${index}`} position={[wall.x, WALL_HEIGHT/2, wall.z]}>
          <boxGeometry args={[CELL_SIZE * 0.9, WALL_HEIGHT, CELL_SIZE * 0.9]} />
          <meshStandardMaterial color="#2d5a1d" />
        </mesh>
      ))}
      
      {/* Render bamboo instances */}
      {bambooTemplate && bambooInstances.map((instance, index) => {
        const clone = bambooTemplate.clone()
        const finalScale = bambooScale * instance.scaleVar
        clone.scale.setScalar(finalScale)
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
