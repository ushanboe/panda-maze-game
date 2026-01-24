import { useState, useMemo, useEffect, useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { Player } from './Player'
import { Maze } from './Maze'
import { Minimap } from './Minimap'
import { HUD } from './HUD'
import { GameMenu } from './GameMenu'
import { TouchControls } from './TouchControls'
import { ScoreDisplay } from './ScoreDisplay'
import { PointPopups } from './PointPopup'
import { Coins } from './Coin'
import { TreasureChest } from './TreasureChest'
import { Ghost } from './Ghost'
import { generateMaze, getMazeWalls, gridToWorld } from '../utils/mazeGenerator'
import { useGameStore } from '../stores/gameStore'
import { SoundManager } from '../utils/SoundManager'

const MAZE_WIDTH = 21
const MAZE_HEIGHT = 21
const CELL_SIZE = 2

// Loading fallback for 3D models
function LoadingFallback() {
  return (
    <mesh position={[0, 1, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff6600" />
    </mesh>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[500, 500]} />
      <meshStandardMaterial color="#3d5c3d" />
    </mesh>
  )
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 50, 25]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
    </>
  )
}

// Minimal scene for menu - just a simple background, no heavy geometry
function MenuScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#3d5c3d" />
      </mesh>
    </>
  )
}

export function Game() {
  const gameState = useGameStore(state => state.gameState)
  const winGame = useGameStore(state => state.winGame)
  const catchPlayer = useGameStore(state => state.catchPlayer)
  const prevGameState = useRef(gameState)

  const directionRef = useRef(null)
  const [mazeKey, setMazeKey] = useState(0)

  // Only generate maze when actually playing
  const mazeData = useMemo(() => {
    if (gameState !== 'playing' && gameState !== 'won' && gameState !== 'lost' && gameState !== 'caught') {
      return null
    }
    return generateMaze(MAZE_WIDTH, MAZE_HEIGHT)
  }, [mazeKey, gameState === 'playing'])

  const walls = useMemo(() => {
    if (!mazeData) return []
    return getMazeWalls(mazeData, CELL_SIZE)
  }, [mazeData])

  const exitPosition = useMemo(() => {
    if (!mazeData || !mazeData.exit) return { x: 0, z: 0 }
    return gridToWorld(mazeData.exit.x, mazeData.exit.y, mazeData, CELL_SIZE)
  }, [mazeData])

  // Initialize sound manager
  useEffect(() => {
    SoundManager.init()
  }, [])

  // Play sounds on game state changes
  useEffect(() => {
    if (gameState === 'playing' && prevGameState.current !== 'playing') {
      SoundManager.gameStart()
    }
    if ((gameState === 'lost' || gameState === 'caught') && prevGameState.current === 'playing') {
      SoundManager.gameLose()
    }
    prevGameState.current = gameState
  }, [gameState])

  // Regenerate maze when starting new game
  useEffect(() => {
    if (gameState === 'playing') {
      setMazeKey(k => k + 1)
    }
  }, [gameState])

  const handleReachExit = () => {
    winGame()
  }

  const handleGhostCatch = () => {
    catchPlayer()
  }

  const handleTouchDirection = (direction) => {
    if (directionRef.current) {
      directionRef.current(direction)
    }
  }

  // Check if we should render the full game scene
  const isGameActive = gameState === 'playing' || gameState === 'won' || gameState === 'lost' || gameState === 'caught'

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 3D Canvas - render minimal scene during menu, full scene during gameplay */}
      <Canvas
        shadows={isGameActive}
        camera={{ position: [0, 15, 20], fov: 60 }}
        style={{ background: '#1a1a2e' }}
        frameloop={isGameActive ? 'always' : 'demand'} // Only render on demand during menu
      >
        {isGameActive ? (
          // Full game scene
          <>
            <Sky sunPosition={[100, 50, 100]} />
            <fog attach="fog" args={['#87ceeb', 40, 100]} />
            <Lights />
            <Ground />

            {mazeData && <Maze walls={walls} exitPosition={exitPosition} mazeData={mazeData} />}

            {gameState === 'playing' && (
              <>
                <Coins />
                <TreasureChest type="10K" />
                <TreasureChest type="50K" />
              </>
            )}

            {gameState === 'playing' && mazeData && (
              <Suspense fallback={<LoadingFallback />}>
                <Player
                  mazeData={mazeData}
                  walls={walls}
                  onReachExit={handleReachExit}
                  onDirectionRef={directionRef}
                />
                <Ghost
                  mazeData={mazeData}
                  walls={walls}
                  onCatchPlayer={handleGhostCatch}
                />
              </Suspense>
            )}
          </>
        ) : (
          // Minimal menu scene - no heavy geometry
          <MenuScene />
        )}
      </Canvas>

      {/* UI Overlays */}
      {gameState === 'playing' && (
        <>
          <HUD />
          <Minimap mazeData={mazeData} walls={walls} />
          <TouchControls onDirection={handleTouchDirection} />
          <ScoreDisplay />
          <PointPopups />
        </>
      )}

      <GameMenu />
    </div>
  )
}
