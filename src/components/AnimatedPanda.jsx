
import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useFBX } from '@react-three/drei'
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

export function AnimatedPanda({ isMoving, hasWon, scale = 0.007 }) {
  const groupRef = useRef()
  const mixerRef = useRef(null)
  const actionsRef = useRef({})
  const currentActionRef = useRef(null)

  // Track caught state for disappear animation
  const playerCaught = useGameStore(state => state.playerCaught)
  const [opacity, setOpacity] = useState(1)
  const [disappearScale, setDisappearScale] = useState(1)
  const materialsRef = useRef([])

  // Load FBX models
  const idleFbx = useFBX('/models/panda_idle.fbx')
  const walkFbx = useFBX('/models/panda_walk.fbx')

  // Clone the model to avoid sharing skeleton issues
  const clonedModel = useMemo(() => {
    if (!idleFbx) return null
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
  }, [idleFbx])

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
    if (!clonedModel) return

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
    if (walkFbx.animations && walkFbx.animations.length > 0) {
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
  }, [clonedModel, idleFbx, walkFbx])

  // Handle animation transitions
  useEffect(() => {
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
  }, [isMoving])

  // Animation loop
  useFrame((state, delta) => {
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

  if (!clonedModel) {
    // Simple loading placeholder - small sphere
    return (
      <mesh>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>
    )
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
