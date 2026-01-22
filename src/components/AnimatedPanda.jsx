import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import * as THREE from 'three'

// Helper function to fix bone names in animation tracks
// Mixamo animations use "mixamorig:BoneName" but model has "mixamorigBoneName"
function fixAnimationTrackNames(clip) {
  const newTracks = clip.tracks.map(track => {
    const newTrack = track.clone()
    // Replace "mixamorig:" with "mixamorig" (remove the colon)
    newTrack.name = track.name.replace(/mixamorig:/g, 'mixamorig')
    return newTrack
  })
  
  return new THREE.AnimationClip(clip.name, clip.duration, newTracks)
}

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
    let mounted = true
    
    // Load the base model (Idle) first
    loader.load('/models/panda/Idle.fbx', (fbx) => {
      if (!mounted) return
      
      // Scale and setup the model
      fbx.scale.setScalar(scale)
      fbx.rotation.y = Math.PI
      
      // Create animation mixer
      mixerRef.current = new THREE.AnimationMixer(fbx)
      modelRef.current = fbx
      
      // Store idle animation (fix track names)
      if (fbx.animations.length > 0) {
        const fixedClip = fixAnimationTrackNames(fbx.animations[0])
        const action = mixerRef.current.clipAction(fixedClip)
        actionsRef.current.idle = action
        action.play()
        console.log('Idle animation loaded and playing')
      }
      
      // Add model to group
      if (groupRef.current) {
        groupRef.current.add(fbx)
      }
      
      // Load walk animation
      loader.load('/models/panda/Start_Walking.fbx', (walkFbx) => {
        if (!mounted) return
        
        if (walkFbx.animations.length > 0 && mixerRef.current) {
          const fixedClip = fixAnimationTrackNames(walkFbx.animations[0])
          const action = mixerRef.current.clipAction(fixedClip)
          actionsRef.current.walk = action
          console.log('Walk animation loaded')
        }
        
        // Load dance animation
        loader.load('/models/panda/Hip_Hop_Dancing.fbx', (danceFbx) => {
          if (!mounted) return
          
          if (danceFbx.animations.length > 0 && mixerRef.current) {
            const fixedClip = fixAnimationTrackNames(danceFbx.animations[0])
            const action = mixerRef.current.clipAction(fixedClip)
            actionsRef.current.dance = action
            console.log('Dance animation loaded')
          }
          setLoaded(true)
          console.log('All animations loaded!')
        })
      })
    })
    
    return () => {
      mounted = false
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
      console.log('Switching animation:', currentAnim, '->', targetAnim)
      
      const prevAction = actions[currentAnim]
      const nextAction = actions[targetAnim]
      
      if (prevAction && nextAction) {
        prevAction.fadeOut(0.2)
        nextAction.reset().fadeIn(0.2).play()
      } else if (nextAction) {
        nextAction.reset().fadeIn(0.2).play()
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
