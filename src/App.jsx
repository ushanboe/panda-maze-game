import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Game } from './components/Game'
import { LandingPage } from './pages/LandingPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/play" element={<Game />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
