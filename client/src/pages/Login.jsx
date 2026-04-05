import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
          <div className="landing-logo-icon">H</div>
          <span className="landing-logo-text">Higgsfield AI</span>
        </div>
        <div className="landing-nav-links">
          <button className="btn btn-ghost" onClick={() => navigate('/register')}>
            Register
          </button>
        </div>
      </nav>

      <section className="hero">
        <h1>Welcome Back</h1>
        <p className="hero-subtitle">Login to your account.</p>
        
        <form onSubmit={handleLogin} style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
          {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </section>
    </div>
  );
}
