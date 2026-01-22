import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import * as THREE from 'three'

// Helper function to retarget animation tracks to match skeleton
function retargetAnimation(clip, sourceSkeleton, targetSkeleton) {
  // Get bone names from target skeleton
  const targetBoneNames = new Set()
  targetSkeleton.traverse((child) => {
    if (child.isBone) {
      targetBoneNames.add(child.name)
    }
  })
  
  // Clone the clip and fix track names
  const newTracks = []
  for (const track of clip.tracks) {
    // Track names are like "boneName.position" or "boneName.quaternion"
    const parts = track.name.split('.')
    const boneName = parts[0]
    const property = parts.slice(1).join('.')
    
    // Check if target has this bone
    if (targetBoneNames.has(boneName)) {
      newTracks.push(track.clone())
    } else {
      // Try to find matching bone (sometimes prefix differs)
      const simpleName = boneName.replace('mixamorig:', '').replace('mixamorig', '')
      for (const targetName of targetBoneNames) {
        const simpleTarget = targetName.replace('mixamorig:', '').replace('mixamorig', '')
        if (simpleName === simpleTarget || targetName.includes(simpleName) || simpleName.includes(targetName)) {
          const newTrack = track.clone()
          newTrack.name = targetName + '.' + property
          newTracks.push(newTrack)
          break
        }
      }
    }
  }
  
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
      
      // Log skeleton bones for debugging
      console.log('Model bones:')
      fbx.traverse((child) => {
        if (child.isBone) {
          console.log(' -', child.name)
        }
      })
      
      // Create animation mixer
      mixerRef.current = new THREE.AnimationMixer(fbx)
      modelRef.current = fbx
      
      // Store idle animation
      if (fbx.animations.length > 0) {
        console.log('Idle animation tracks:', fbx.animations[0].tracks.map(t => t.name))
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
        if (!mounted) return
        
        if (walkFbx.animations.length > 0 && mixerRef.current) {
          console.log('Walk animation tracks:', walkFbx.animations[0].tracks.map(t => t.name))
          
          // Try to retarget the animation
          const retargetedClip = retargetAnimation(walkFbx.animations[0], walkFbx, fbx)
          const action = mixerRef.current.clipAction(retargetedClip)
          actionsRef.current.walk = action
        }
        
        // Load dance animation
        loader.load('/models/panda/Hip_Hop_Dancing.fbx', (danceFbx) => {
          if (!mounted) return
          
          if (danceFbx.animations.length > 0 && mixerRef.current) {
            const retargetedClip = retargetAnimation(danceFbx.animations[0], danceFbx, fbx)
            const action = mixerRef.current.clipAction(retargetedClip)
            actionsRef.current.dance = action
          }
          setLoaded(true)
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
