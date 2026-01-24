import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { useGameStore } from '../stores/gameStore'

// Fix Mixamo bone names - remove colons from track names
function fixMixamoBoneNames(clip) {
  clip.tracks.forEach(track => {
    track.name = track.name.replace(/mixamorig:/g, 'mixamorig')
  })
  return clip
}

// Simple procedural panda as fallback
function ProceduralPanda({ isMoving, hasWon }) {
  const groupRef = useRef()
  const playerCaught = useGameStore(state => state.playerCaught)

  useFrame((state, delta) => {
    if (!groupRef.current) return

    // Bobbing animation when moving
    if (isMoving) {
      groupRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 0.1
    } else {
      groupRef.current.position.y = 0
    }

    // Win celebration
    if (hasWon) {
      groupRef.current.rotation.y += delta * 5
      groupRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.3
    }

    // Caught animation
    if (playerCaught) {
      groupRef.current.rotation.y += delta * 15
      groupRef.current.scale.multiplyScalar(0.98)
    }
  })

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.2, 1.25, 0]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.2, 1.25, 0]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 1.05, 0.25]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.1, 1.05, 0.25]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 0.95, 0.28]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )
}

export function AnimatedPanda({ isMoving, hasWon, scale = 0.007 }) {
  const groupRef = useRef()
  const mixerRef = useRef(null)
  const actionsRef = useRef({})
  const currentActionRef = useRef(null)
  const [useFallback, setUseFallback] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)

  // Track caught state for disappear animation
  const playerCaught = useGameStore(state => state.playerCaught)
  const [opacity, setOpacity] = useState(1)
  const [disappearScale, setDisappearScale] = useState(1)
  const materialsRef = useRef([])

  // Try to load FBX models with error handling
  let idleFbx = null
  let walkFbx = null
  let loadError = false

  try {
    idleFbx = useLoader(FBXLoader, '/models/panda_idle.fbx')
    walkFbx = useLoader(FBXLoader, '/models/panda_walk.fbx')
  } catch (error) {
    console.error('FBX loading error:', error)
    loadError = true
  }

  // Set fallback if loading fails
  useEffect(() => {
    if (loadError) {
      console.log('Using procedural panda fallback due to FBX load error')
      setUseFallback(true)
    } else if (idleFbx && walkFbx) {
      console.log('FBX models loaded successfully')
      setModelsLoaded(true)
    }
  }, [loadError, idleFbx, walkFbx])

  // Clone the model to avoid sharing skeleton issues
  const clonedModel = useMemo(() => {
    if (!idleFbx || useFallback) return null
    try {
      const clone = SkeletonUtils.clone(idleFbx)

      // Fix bone names in the cloned model
      clone.traverse((child) => {
        if (child.isBone) {
          child.name = child.name.replace(/mixamorig:/g, 'mixamorig')
        }
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          // Make material transparent-capable for disappear effect
          if (child.material) {
            child.material = child.material.clone()
            child.material.transparent = true
          }
        }
      })

      return clone
    } catch (error) {
      console.error('Error cloning FBX model:', error)
      setUseFallback(true)
      return null
    }
  }, [idleFbx, useFallback])

  // Collect materials for opacity animation
  useEffect(() => {
    if (!clonedModel) return
    const mats = []
    clonedModel.traverse((child) => {
      if (child.isMesh && child.material) {
        mats.push(child.material)
      }
    })
    materialsRef.current = mats
  }, [clonedModel])

  // Setup animation mixer and actions
  useEffect(() => {
    if (!clonedModel || useFallback) return

    try {
      const mixer = new THREE.AnimationMixer(clonedModel)
      mixerRef.current = mixer

      // Setup idle animation
      if (idleFbx.animations && idleFbx.animations.length > 0) {
        const idleClip = fixMixamoBoneNames(idleFbx.animations[0].clone())
        idleClip.name = 'idle'
        const idleAction = mixer.clipAction(idleClip)
        actionsRef.current.idle = idleAction
      }

      // Setup walk animation
      if (walkFbx && walkFbx.animations && walkFbx.animations.length > 0) {
        const walkClip = fixMixamoBoneNames(walkFbx.animations[0].clone())
        walkClip.name = 'walk'
        const walkAction = mixer.clipAction(walkClip)
        actionsRef.current.walk = walkAction
      }

      // Start with idle
      if (actionsRef.current.idle) {
        actionsRef.current.idle.play()
        currentActionRef.current = actionsRef.current.idle
      }

      return () => {
        mixer.stopAllAction()
        mixer.uncacheRoot(clonedModel)
      }
    } catch (error) {
      console.error('Error setting up animations:', error)
      setUseFallback(true)
    }
  }, [clonedModel, idleFbx, walkFbx, useFallback])

  // Handle animation transitions
  useEffect(() => {
    if (useFallback) return
    const actions = actionsRef.current
    const currentAction = currentActionRef.current

    if (!actions.idle || !actions.walk) return

    const targetAction = isMoving ? actions.walk : actions.idle

    if (currentAction !== targetAction) {
      targetAction.reset()
      targetAction.setEffectiveTimeScale(1)
      targetAction.setEffectiveWeight(1)
      targetAction.fadeIn(0.2)

      if (currentAction) {
        currentAction.fadeOut(0.2)
      }

      targetAction.play()
      currentActionRef.current = targetAction
    }
  }, [isMoving, useFallback])

  // Animation loop
  useFrame((state, delta) => {
    if (useFallback) return

    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    // Win celebration - spin and bounce
    if (hasWon && groupRef.current) {
      groupRef.current.rotation.y += delta * 5
      groupRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.3
    }

    // Caught by ghost - disappear animation
    if (playerCaught && groupRef.current) {
      // Spin fast and shrink
      groupRef.current.rotation.y += delta * 15

      // Shrink and fade
      const newScale = Math.max(0, disappearScale - delta * 1.5)
      setDisappearScale(newScale)

      const newOpacity = Math.max(0, opacity - delta * 1.2)
      setOpacity(newOpacity)

      // Update materials opacity
      materialsRef.current.forEach(mat => {
        mat.opacity = newOpacity
      })

      // Float up while disappearing
      groupRef.current.position.y += delta * 3
    }
  })

  // Use procedural fallback if FBX loading failed
  if (useFallback || !clonedModel) {
    return <ProceduralPanda isMoving={isMoving} hasWon={hasWon} />
  }

  // Don't render if fully disappeared
  if (playerCaught && disappearScale <= 0) {
    return null
  }

  const finalScale = playerCaught ? scale * disappearScale : scale

  return (
    <group ref={groupRef} scale={[finalScale, finalScale, finalScale]} position={[0, 0, 0]}>
      <primitive object={clonedModel} />
    </group>
  )
}
