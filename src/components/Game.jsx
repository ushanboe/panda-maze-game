import { useState, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { Player } from './Player'
import { Maze } from './Maze'
import { Minimap } from './Minimap'
import { HUD } from './HUD'
import { GameMenu } from './GameMenu'
import { generateMaze, getMazeWalls, gridToWorld } from '../utils/mazeGenerator'
import { useGameStore } from '../stores/gameStore'

const MAZE_WIDTH = 21  // Must be odd
const MAZE_HEIGHT = 21 // Must be odd
const CELL_SIZE = 2

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
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

export function Game() {
  const gameState = useGameStore(state => state.gameState)
  const winGame = useGameStore(state => state.winGame)
  
  // Generate maze once and regenerate on new game
  const [mazeKey, setMazeKey] = useState(0)
  
  const mazeData = useMemo(() => {
    return generateMaze(MAZE_WIDTH, MAZE_HEIGHT)
  }, [mazeKey])
  
  const walls = useMemo(() => {
    return getMazeWalls(mazeData, CELL_SIZE)
  }, [mazeData])
  
  const exitPosition = useMemo(() => {
    return gridToWorld(mazeData.exit.x, mazeData.exit.y, mazeData, CELL_SIZE)
  }, [mazeData])
  
  // Regenerate maze when starting new game
  useEffect(() => {
    if (gameState === 'playing') {
      setMazeKey(k => k + 1)
    }
  }, [gameState])
  
  const handleReachExit = () => {
    winGame()
  }
  
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 15, 20], fov: 60 }}
        style={{ background: '#1a1a2e' }}
      >
        <Sky sunPosition={[100, 50, 100]} />
        <Lights />
        <Ground />
        
        <Maze walls={walls} exitPosition={exitPosition} />
        
        {gameState === 'playing' && (
          <Player
            mazeData={mazeData}
            walls={walls}
            onReachExit={handleReachExit}
          />
        )}
      </Canvas>
      
      {/* UI Overlays */}
      {gameState === 'playing' && (
        <>
          <HUD />
          <Minimap mazeData={mazeData} walls={walls} />
        </>
      )}
      
      <GameMenu />
    </div>
  )
}
