import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame, useGraph } from '@react-three/fiber'
import { useFBX, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'

export function AnimatedPanda({ isMoving, hasWon, scale = 0.0075 }) {
  const groupRef = useRef()
  const [currentAnim, setCurrentAnim] = useState('idle')
  
  // Load all FBX models
  const idleFbx = useFBX('/models/panda/Idle.fbx')
  const walkFbx = useFBX('/models/panda/Start_Walking.fbx')
  const danceFbx = useFBX('/models/panda/Hip_Hop_Dancing.fbx')
  
  // Clone the model so we can reuse it
  const clonedScene = useMemo(() => {
    if (idleFbx) {
      return SkeletonUtils.clone(idleFbx)
    }
    return null
  }, [idleFbx])
  
  // Combine all animations into one array
  const animations = useMemo(() => {
    const anims = []
    
    if (idleFbx?.animations?.[0]) {
      const clip = idleFbx.animations[0].clone()
      clip.name = 'idle'
      anims.push(clip)
    }
    if (walkFbx?.animations?.[0]) {
      const clip = walkFbx.animations[0].clone()
      clip.name = 'walk'
      anims.push(clip)
    }
    if (danceFbx?.animations?.[0]) {
      const clip = danceFbx.animations[0].clone()
      clip.name = 'dance'
      anims.push(clip)
    }
    
    return anims
  }, [idleFbx, walkFbx, danceFbx])
  
  // Use the animations hook from drei
  const { actions, mixer } = useAnimations(animations, clonedScene)
  
  // Start idle animation on mount
  useEffect(() => {
    if (actions?.idle) {
      actions.idle.reset().fadeIn(0.2).play()
    }
  }, [actions])
  
  // Handle animation transitions based on state
  useEffect(() => {
    if (!actions) return
    
    let targetAnim = 'idle'
    if (hasWon && actions.dance) {
      targetAnim = 'dance'
    } else if (isMoving && actions.walk) {
      targetAnim = 'walk'
    }
    
    if (targetAnim !== currentAnim) {
      // Fade out current
      const currentAction = actions[currentAnim]
      const targetAction = actions[targetAnim]
      
      if (currentAction) {
        currentAction.fadeOut(0.2)
      }
      
      if (targetAction) {
        targetAction.reset().fadeIn(0.2).play()
      }
      
      setCurrentAnim(targetAnim)
    }
  }, [isMoving, hasWon, actions, currentAnim])
  
  if (!clonedScene) return null
  
  return (
    <group ref={groupRef} scale={[scale, scale, scale]} rotation={[0, Math.PI, 0]}>
      <primitive object={clonedScene} />
    </group>
  )
}
