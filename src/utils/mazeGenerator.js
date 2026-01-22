// Maze generator using recursive backtracking
export function generateMaze(width, height) {
  // Initialize grid with all walls
  const maze = Array(height).fill(null).map(() => 
    Array(width).fill(1) // 1 = wall, 0 = path
  )
  
  // Directions: [dx, dy]
  const directions = [
    [0, -2], // up
    [2, 0],  // right
    [0, 2],  // down
    [-2, 0]  // left
  ]
  
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }
  
  function carve(x, y) {
    maze[y][x] = 0
    
    const shuffledDirs = shuffle([...directions])
    
    for (const [dx, dy] of shuffledDirs) {
      const nx = x + dx
      const ny = y + dy
      
      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === 1) {
        // Carve through the wall between current and next cell
        maze[y + dy/2][x + dx/2] = 0
        carve(nx, ny)
      }
    }
  }
  
  // Start from center (odd coordinates)
  const startX = Math.floor(width / 2) | 1
  const startY = Math.floor(height / 2) | 1
  carve(startX, startY)
  
  // Create exit at edge
  const exitSide = Math.floor(Math.random() * 4)
  let exitX, exitY
  
  switch(exitSide) {
    case 0: // top
      exitX = (Math.floor(Math.random() * (width - 2) / 2) * 2 + 1)
      exitY = 0
      maze[1][exitX] = 0 // ensure path to exit
      break
    case 1: // right
      exitX = width - 1
      exitY = (Math.floor(Math.random() * (height - 2) / 2) * 2 + 1)
      maze[exitY][width - 2] = 0
      break
    case 2: // bottom
      exitX = (Math.floor(Math.random() * (width - 2) / 2) * 2 + 1)
      exitY = height - 1
      maze[height - 2][exitX] = 0
      break
    case 3: // left
      exitX = 0
      exitY = (Math.floor(Math.random() * (height - 2) / 2) * 2 + 1)
      maze[exitY][1] = 0
      break
  }
  maze[exitY][exitX] = 0
  
  return {
    grid: maze,
    start: { x: startX, y: startY },
    exit: { x: exitX, y: exitY },
    width,
    height
  }
}

// Convert maze grid to 3D wall positions
export function getMazeWalls(mazeData, cellSize = 2) {
  const walls = []
  const { grid, width, height } = mazeData
  
  const offsetX = -(width * cellSize) / 2
  const offsetZ = -(height * cellSize) / 2
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === 1) {
        walls.push({
          x: x * cellSize + offsetX + cellSize / 2,
          z: y * cellSize + offsetZ + cellSize / 2,
          isEdge: x === 0 || x === width - 1 || y === 0 || y === height - 1
        })
      }
    }
  }
  
  return walls
}

// Get world position from grid position
export function gridToWorld(gridX, gridY, mazeData, cellSize = 2) {
  const offsetX = -(mazeData.width * cellSize) / 2
  const offsetZ = -(mazeData.height * cellSize) / 2
  
  return {
    x: gridX * cellSize + offsetX + cellSize / 2,
    z: gridY * cellSize + offsetZ + cellSize / 2
  }
}
