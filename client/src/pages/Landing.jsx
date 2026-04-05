import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';



export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">


      {}
      <nav className="landing-nav" id="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-icon">H</div>
          <span className="landing-logo-text">Higgsfield AI</span>
        </div>
        <div className="landing-nav-links">
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>
            Log In
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>
            Sign Up
          </button>
        </div>
      </nav>

      {}
      <section className="hero" id="hero">
        <h1>
          Collaborate. Create. Build.
        </h1>
        <p className="hero-subtitle">
          A unified workspace where your team brainstorms on a shared canvas, 
          connects via Google Meet, and gets AI-powered assistance — all in one place.
        </p>
        <div className="hero-actions">
          <button
            className="btn btn-primary btn-lg"
            id="cta-get-started"
            onClick={() => navigate('/register')}
          >
            🚀 Get Started
          </button>
          <button
            className="btn btn-secondary btn-lg"
            id="cta-dashboard"
            onClick={() => navigate('/login')}
          >
            Login to Account
          </button>
        </div>
      </section>

      {}
      <section className="features" id="features">
        <p className="features-title">Everything you need</p>
        <div className="features-grid stagger-in">
          <div className="feature-card">
            <div className="feature-icon violet">🎨</div>
            <h3>Excalidraw Canvas</h3>
            <p>
              Infinite whiteboard powered by Excalidraw. Sketch ideas, diagrams, 
              wireframes — and let AI understand your drawings.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon cyan">🤖</div>
            <h3>AI Assistant</h3>
            <p>
              Context-aware AI chatbot that sees your canvas. Ask questions, 
              get suggestions, brainstorm ideas — all without leaving the workspace.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon emerald">📹</div>
            <h3>Google Meet</h3>
            <p>
              Create and join video meetings instantly. Integration with Google Meet 
              for seamless team collaboration alongside your canvas.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon rose">📅</div>
            <h3>Calendar & Scheduling</h3>
            <p>
              Plan sprints and meetings with Google Calendar integration. 
              Auto-attach Meet links to scheduled events.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
