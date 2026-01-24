
import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useGraph } from '@react-three/fiber'
import { useFBX } from '@react-three/drei'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js'

// Fix Mixamo bone names - remove colons from track names
function fixMixamoBoneNames(clip) {
  clip.tracks.forEach(track => {
    // Replace "mixamorig:" with "mixamorig" (remove colon)
    track.name = track.name.replace(/mixamorig:/g, 'mixamorig')
  })
  return clip
}

export function AnimatedPanda({ isMoving, hasWon, scale = 0.02 }) {
  const groupRef = useRef()
  const mixerRef = useRef(null)
  const actionsRef = useRef({})
  const currentActionRef = useRef(null)

  // Load FBX models
  const idleFbx = useFBX('/models/panda_idle.fbx')
  const walkFbx = useFBX('/models/panda_walk.fbx')

  // Clone the model to avoid sharing skeleton issues
  const clonedModel = useMemo(() => {
    if (!idleFbx) return null
    const clone = SkeletonUtils.clone(idleFbx)

    // Fix bone names in the model skeleton
    clone.traverse((child) => {
      if (child.isBone) {
        child.name = child.name.replace(/mixamorig:/g, 'mixamorig')
      }
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    return clone
  }, [idleFbx])

  // Setup animations
  useEffect(() => {
    if (!clonedModel) return

    // Create mixer
    const mixer = new THREE.AnimationMixer(clonedModel)
    mixerRef.current = mixer

    // Get idle animation from idle FBX
    if (idleFbx.animations && idleFbx.animations.length > 0) {
      const idleClip = fixMixamoBoneNames(idleFbx.animations[0].clone())
      idleClip.name = 'idle'
      const idleAction = mixer.clipAction(idleClip)
      actionsRef.current.idle = idleAction
    }

    // Get walk animation from walk FBX
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

  // Switch animations based on isMoving
  useEffect(() => {
    const actions = actionsRef.current
    const currentAction = currentActionRef.current

    if (!actions.idle || !actions.walk) return

    const targetAction = isMoving ? actions.walk : actions.idle

    if (currentAction !== targetAction) {
      // Crossfade to new animation
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

  // Update animation mixer and handle win dance
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    // Win celebration - spin and bounce
    if (hasWon && groupRef.current) {
      groupRef.current.rotation.y += delta * 5
      groupRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.3
    }
  })

  if (!clonedModel) return null

  return (
    <group ref={groupRef} scale={[scale, scale, scale]} position={[0, 0, 0]}>
      <primitive object={clonedModel} />
    </group>
  )
}
