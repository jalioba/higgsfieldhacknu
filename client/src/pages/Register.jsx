import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../services/firebase';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      const userRef = ref(database, 'users/' + user.uid);
      await set(userRef, {
        uid: user.uid,
        name: name,
        email: email,
        registrationDate: new Date().toISOString(),
        role: "user"
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
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
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
      </nav>

      <section className="hero">
        <h1>Create an Account</h1>
        <p className="hero-subtitle">Sign up to start collaborating.</p>
        
        <form onSubmit={handleRegister} style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
          {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
            />
          </div>

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
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </section>
    </div>
  );
}
