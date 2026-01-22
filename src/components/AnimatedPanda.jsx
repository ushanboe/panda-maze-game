import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import * as THREE from 'three'

export function AnimatedPanda({ isMoving, hasWon, scale = 0.0075 }) {
  const groupRef = useRef()
  const mixerRef = useRef(null)
  const actionsRef = useRef({})
  const modelRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [currentAnim, setCurrentAnim] = useState('idle')
  
  // Load model and animations
  useEffect(() => {
    const loader = new FBXLoader()
    
    // Load the base model (Idle) first
    loader.load('/models/panda/Idle.fbx', (fbx) => {
      // Scale and setup the model
      fbx.scale.setScalar(scale)
      fbx.rotation.y = Math.PI
      
      // Create animation mixer
      mixerRef.current = new THREE.AnimationMixer(fbx)
      modelRef.current = fbx
      
      // Store idle animation
      if (fbx.animations.length > 0) {
        const action = mixerRef.current.clipAction(fbx.animations[0])
        actionsRef.current.idle = action
        action.play()
      }
      
      // Add model to group
      if (groupRef.current) {
        groupRef.current.add(fbx)
      }
      
      // Load walk animation
      loader.load('/models/panda/Start_Walking.fbx', (walkFbx) => {
        if (walkFbx.animations.length > 0 && mixerRef.current) {
          const action = mixerRef.current.clipAction(walkFbx.animations[0])
          actionsRef.current.walk = action
        }
        
        // Load dance animation
        loader.load('/models/panda/Hip_Hop_Dancing.fbx', (danceFbx) => {
          if (danceFbx.animations.length > 0 && mixerRef.current) {
            const action = mixerRef.current.clipAction(danceFbx.animations[0])
            actionsRef.current.dance = action
          }
          setLoaded(true)
        })
      })
    })
    
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }
      if (groupRef.current && modelRef.current) {
        groupRef.current.remove(modelRef.current)
      }
    }
  }, [scale])
  
  // Handle animation transitions
  useEffect(() => {
    if (!loaded || !mixerRef.current) return
    
    const actions = actionsRef.current
    
    let targetAnim = 'idle'
    if (hasWon && actions.dance) {
      targetAnim = 'dance'
    } else if (isMoving && actions.walk) {
      targetAnim = 'walk'
    }
    
    if (targetAnim !== currentAnim) {
      const prevAction = actions[currentAnim]
      const nextAction = actions[targetAnim]
      
      if (prevAction && nextAction) {
        prevAction.fadeOut(0.3)
        nextAction.reset().fadeIn(0.3).play()
      } else if (nextAction) {
        nextAction.reset().fadeIn(0.3).play()
      }
      
      setCurrentAnim(targetAnim)
    }
  }, [isMoving, hasWon, loaded, currentAnim])
  
  // Update animation mixer every frame
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })
  
  return <group ref={groupRef} />
}
