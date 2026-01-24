import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useFBX } from '@react-three/drei'
import { AnimationMixer, LoopRepeat } from 'three'
import { useGameStore } from '../stores/gameStore'

// Fix Mixamo bone names (remove namespace prefix)
function fixMixamoBoneNames(clip) {
  clip.tracks.forEach(track => {
    track.name = track.name.replace(/^mixamorig:/, '')
  })
  return clip
}

// Clone skeleton properly
function cloneWithSkeleton(source) {
  const clone = source.clone(true)
  
  clone.traverse(node => {
    if (node.isSkinnedMesh) {
      const skeleton = node.skeleton
      const newBones = []
      
      skeleton.bones.forEach(bone => {
        const clonedBone = clone.getObjectByName(bone.name)
        if (clonedBone) {
          newBones.push(clonedBone)
        }
      })
      
      node.skeleton = skeleton.clone()
      node.skeleton.bones = newBones
      node.bind(node.skeleton, node.bindMatrix)
    }
    
    if (node.isMesh) {
      node.castShadow = true
      node.receiveShadow = true
    }
  })
  
  return clone
}

export function AnimatedPanda({ isMoving, hasWon, scale = 0.025 }) {
  const groupRef = useRef()
  const mixerRef = useRef(null)
  const actionsRef = useRef({})
  const [currentAction, setCurrentAction] = useState('idle')
  const [winAnimStarted, setWinAnimStarted] = useState(false)
  const [caughtAnimStarted, setCaughtAnimStarted] = useState(false)
  const caughtTimeRef = useRef(0)
  
  const playerCaught = useGameStore(state => state.playerCaught)

  // Load FBX models
  const idleFbx = useFBX('/models/Idle.fbx')
  const walkFbx = useFBX('/models/Start_Walking.fbx')
  const danceFbx = useFBX('/models/Hip_Hop_Dancing_2.fbx')
  const angryFbx = useFBX('/models/Angry.fbx')

  // Clone the model to avoid sharing issues
  const model = useMemo(() => {
    if (idleFbx) {
      const cloned = cloneWithSkeleton(idleFbx)
      return cloned
    }
    return null
  }, [idleFbx])

  // Setup animation mixer and actions
  useEffect(() => {
    if (!model || !idleFbx || !walkFbx || !danceFbx || !angryFbx) return

    const mixer = new AnimationMixer(model)
    mixerRef.current = mixer

    // Get animations from each FBX and fix bone names
    const idleClip = idleFbx.animations[0] ? fixMixamoBoneNames(idleFbx.animations[0].clone()) : null
    const walkClip = walkFbx.animations[0] ? fixMixamoBoneNames(walkFbx.animations[0].clone()) : null
    const danceClip = danceFbx.animations[0] ? fixMixamoBoneNames(danceFbx.animations[0].clone()) : null
    const angryClip = angryFbx.animations[0] ? fixMixamoBoneNames(angryFbx.animations[0].clone()) : null

    // Create actions
    if (idleClip) {
      const idleAction = mixer.clipAction(idleClip)
      idleAction.setLoop(LoopRepeat)
      actionsRef.current.idle = idleAction
    }

    if (walkClip) {
      const walkAction = mixer.clipAction(walkClip)
      walkAction.setLoop(LoopRepeat)
      actionsRef.current.walk = walkAction
    }

    if (danceClip) {
      const danceAction = mixer.clipAction(danceClip)
      danceAction.setLoop(LoopRepeat)
      actionsRef.current.dance = danceAction
    }

    if (angryClip) {
      const angryAction = mixer.clipAction(angryClip)
      angryAction.setLoop(LoopRepeat)
      actionsRef.current.angry = angryAction
    }

    // Start with idle
    if (actionsRef.current.idle) {
      actionsRef.current.idle.play()
    }

    return () => {
      mixer.stopAllAction()
      mixer.uncacheRoot(model)
    }
  }, [model, idleFbx, walkFbx, danceFbx, angryFbx])

  // Handle animation transitions
  useEffect(() => {
    if (!mixerRef.current || !actionsRef.current) return

    const actions = actionsRef.current
    let targetAction = 'idle'

    if (playerCaught && !caughtAnimStarted) {
      // Switch to angry animation when caught
      targetAction = 'angry'
      setCaughtAnimStarted(true)
      caughtTimeRef.current = 0
    } else if (playerCaught) {
      targetAction = 'angry'
    } else if (hasWon && !winAnimStarted) {
      targetAction = 'dance'
      setWinAnimStarted(true)
    } else if (hasWon) {
      targetAction = 'dance'
    } else if (isMoving) {
      targetAction = 'walk'
    } else {
      targetAction = 'idle'
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
  }, [isMoving, hasWon, playerCaught, currentAction, winAnimStarted, caughtAnimStarted])

  // Animation update loop
  useFrame((state, delta) => {
    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    if (!groupRef.current) return

    // Caught animation - float up for 9 seconds while playing angry animation
    if (playerCaught) {
      caughtTimeRef.current += delta
      
      // Float up smoothly for 9 seconds
      if (caughtTimeRef.current < 16) {
        // Float up at a steady rate
        groupRef.current.position.y += delta * 1.5
        // Gentle rotation
        groupRef.current.rotation.y += delta * 2
      }
    }
  })

  if (!model) {
    // Fallback loading indicator
    return (
      <mesh>
        <boxGeometry args={[0.5, 1, 0.5]} />
        <meshStandardMaterial color="#ff6600" />
      </mesh>
    )
  }

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={model} />
    </group>
  )
}
