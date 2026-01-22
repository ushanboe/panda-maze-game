import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useFBX } from '@react-three/drei'
import * as THREE from 'three'

export function AnimatedPanda({ isMoving, hasWon, scale = 0.015 }) {
  const groupRef = useRef()
  const mixerRef = useRef()
  const actionsRef = useRef({})
  const [currentAction, setCurrentAction] = useState('idle')
  
  // Load all FBX models
  const idleModel = useFBX('/models/panda/Idle.fbx')
  const walkModel = useFBX('/models/panda/Start_Walking.fbx')
  const danceModel = useFBX('/models/panda/Hip_Hop_Dancing.fbx')
  
  // Setup animations
  useEffect(() => {
    if (idleModel) {
      // Create mixer from the idle model (base mesh)
      mixerRef.current = new THREE.AnimationMixer(idleModel)
      
      // Store animations
      if (idleModel.animations.length > 0) {
        actionsRef.current.idle = mixerRef.current.clipAction(idleModel.animations[0])
      }
      if (walkModel.animations.length > 0) {
        actionsRef.current.walk = mixerRef.current.clipAction(walkModel.animations[0])
      }
      if (danceModel.animations.length > 0) {
        actionsRef.current.dance = mixerRef.current.clipAction(danceModel.animations[0])
      }
      
      // Start with idle
      if (actionsRef.current.idle) {
        actionsRef.current.idle.play()
      }
    }
    
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }
    }
  }, [idleModel, walkModel, danceModel])
  
  // Handle animation transitions
  useEffect(() => {
    const actions = actionsRef.current
    const mixer = mixerRef.current
    if (!mixer || !actions.idle) return
    
    let targetAction = 'idle'
    if (hasWon) {
      targetAction = 'dance'
    } else if (isMoving) {
      targetAction = 'walk'
    }
    
    if (targetAction !== currentAction && actions[targetAction]) {
      // Fade out current action
      if (actions[currentAction]) {
        actions[currentAction].fadeOut(0.2)
      }
      
      // Fade in new action
      actions[targetAction].reset().fadeIn(0.2).play()
      setCurrentAction(targetAction)
    }
  }, [isMoving, hasWon, currentAction])
  
  // Update animation mixer
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })
  
  if (!idleModel) return null
  
  return (
    <group ref={groupRef} scale={[scale, scale, scale]} rotation={[0, Math.PI, 0]}>
      <primitive object={idleModel} />
    </group>
  )
}
