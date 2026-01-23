import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing-container">
      {/* Starfield Background */}
      <div className="starfield">
        <div className="stars stars-1"></div>
        <div className="stars stars-2"></div>
      </div>

      {/* Scanlines */}
      <div className="scanlines"></div>

      {/* Back to Oldskool */}
      <a href="https://oldskool.games" className="back-link">← OLDSKOOL.GAMES</a>

      {/* Hero Section */}
      <header className="hero">
        <div className="panda-logo">🐼</div>
        <h1 className="game-title">
          GO PANDA<span className="highlight"> RUN</span>
        </h1>
        <p className="version">VERSION 1.0</p>
        <p className="tagline">Escape the Bamboo Maze!</p>
        
        <button className="play-button" onClick={() => navigate('/play')}>
          <span className="play-icon">▶</span> PLAY NOW
        </button>
        
        <p className="free-badge">🎮 FREE TO PLAY 🎮</p>
      </header>

      {/* Game Preview */}
      <section className="preview-section">
        <h2 className="section-title">★ GAME PREVIEW ★</h2>
        <div className="preview-box">
          <div className="preview-content">
            <div className="preview-panda">🐼</div>
            <div className="preview-maze">
              <span>🎋</span><span>🎋</span><span>🎋</span>
              <span>🎋</span><span>⬛</span><span>🎋</span>
              <span>🎋</span><span>🎋</span><span>✨</span>
            </div>
          </div>
          <p className="preview-text">Navigate through the bamboo forest maze!</p>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2 className="section-title">★ FEATURES ★</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🕹️</span>
            <h3>PAC-MAN CONTROLS</h3>
            <p>Classic arcade-style movement. Tap a direction and go!</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🎋</span>
            <h3>BAMBOO MAZE</h3>
            <p>Beautiful 3D bamboo forest with procedural generation.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">⏱️</span>
            <h3>BEAT THE CLOCK</h3>
            <p>3 minutes to escape! Can you find the exit in time?</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🗺️</span>
            <h3>MINIMAP</h3>
            <p>Track your path with the breadcrumb trail minimap.</p>
          </div>
        </div>
      </section>

      {/* How to Play */}
      <section className="howto-section">
        <h2 className="section-title">★ HOW TO PLAY ★</h2>
        <div className="controls-display">
          <div className="control-key">
            <span className="key">W</span>
            <span className="key-label">UP</span>
          </div>
          <div className="control-row">
            <div className="control-key">
              <span className="key">A</span>
              <span className="key-label">LEFT</span>
            </div>
            <div className="control-key">
              <span className="key">S</span>
              <span className="key-label">DOWN</span>
            </div>
            <div className="control-key">
              <span className="key">D</span>
              <span className="key-label">RIGHT</span>
            </div>
          </div>
        </div>
        <p className="controls-hint">Or use Arrow Keys! Tap once to move until you hit a wall.</p>
      </section>

      {/* Premium Coming Soon */}
      <section className="premium-section">
        <h2 className="section-title premium-title">★ PREMIUM FEATURES ★</h2>
        <div className="coming-soon-badge">COMING SOON</div>
        <div className="premium-grid">
          <div className="premium-card">
            <span className="premium-icon">🌍</span>
            <h3>MULTIPLE WORLDS</h3>
            <p>Snow, Desert, Jungle & more maze themes!</p>
          </div>
          <div className="premium-card">
            <span className="premium-icon">👕</span>
            <h3>PANDA SKINS</h3>
            <p>Customize your panda with cool outfits!</p>
          </div>
          <div className="premium-card">
            <span className="premium-icon">🏆</span>
            <h3>LEADERBOARDS</h3>
            <p>Compete globally for the fastest escape!</p>
          </div>
          <div className="premium-card">
            <span className="premium-icon">🎵</span>
            <h3>SOUNDTRACK</h3>
            <p>Original retro chiptune music!</p>
          </div>
          <div className="premium-card">
            <span className="premium-icon">👻</span>
            <h3>GHOST MODE</h3>
            <p>Race against your best time ghost!</p>
          </div>
          <div className="premium-card">
            <span className="premium-icon">🎁</span>
            <h3>POWER-UPS</h3>
            <p>Speed boost, wall break, time freeze!</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <button className="play-button large" onClick={() => navigate('/play')}>
          <span className="play-icon">▶</span> START PLAYING NOW
        </button>
        <p className="cta-sub">No download required • Works on mobile & desktop</p>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <a href="https://oldskool.games" className="footer-link">OLDSKOOL.GAMES</a>
        <p className="copyright">© 2025 GO PANDA RUN • VERSION 1.0</p>
        <p className="insert-coin">INSERT COIN TO CONTINUE</p>
      </footer>
    </div>
  )
}
