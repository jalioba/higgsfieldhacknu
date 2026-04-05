import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, database } from '../services/firebase';
import { ref, query, orderByChild, equalTo, get, set, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

const DEMO_WORKSPACES = [
  {
    id: 'demo-1',
    name: 'Product Brainstorm (Demo)',
    description: 'Initial ideas and wireframes for the new product launch',
    updatedAt: new Date().toISOString(),
    memberCount: 3,
    canvasElements: 24,
  },
  {
    id: 'demo-2',
    name: 'Sprint Planning (Demo)',
    description: 'Q2 sprint board and task breakdown for the dev team',
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    memberCount: 5,
    canvasElements: 12,
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [myWorkspaces, setMyWorkspaces] = useState([]);
  const [sharedWorkspaceIds, setSharedWorkspaceIds] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        
        const myWsRef = ref(database, `users/${user.uid}/myWorkspaces`);
        onValue(myWsRef, (snapshot) => {
          if (snapshot.exists()) {
            setMyWorkspaces(Object.values(snapshot.val()));
          } else {
            setMyWorkspaces([]);
          }
        });

        
        const sharedWsRef = ref(database, `users/${user.uid}/sharedWorkspaces`);
        onValue(sharedWsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const sharedArr = Object.values(data);
            setSharedWorkspaceIds(sharedArr);
          } else {
            setSharedWorkspaceIds([]);
          }
        });
      } else {
        setMyWorkspaces([]);
        setSharedWorkspaceIds([]);
      }
      setLoadingInitial(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateWorkspace = async () => {
    if (!currentUser) {
      alert("You need to login to create your own personal workspaces! Creating a temporary demo session...");
      const id = 'ws-' + Date.now();
      navigate(`/workspace/${id}`);
      return;
    }

    const name = prompt('Workspace name:');
    if (!name) return;
    
    const wsId = 'ws-' + Date.now();
    const newWs = {
      id: wsId,
      name,
      description: 'Personal workspace',
      updatedAt: new Date().toISOString(),
      memberCount: 1,
      canvasElements: 0
    };

    try {
      const myWsRef = ref(database, `users/${currentUser.uid}/myWorkspaces/${wsId}`);
      await set(myWsRef, newWs);
      navigate(`/workspace/${wsId}`);
    } catch(err) {
      alert("Failed to create workspace in database.");
    }
  };

  const handleShareWorkspace = async (e, ws) => {
    e.stopPropagation(); 
    if (!currentUser) return;

    const emailToShare = prompt(`Enter the email to share "${ws.name}" with:`);
    if (!emailToShare) return;

    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const allUsers = snapshot.val();
        let recipientId = null;

        
        for (const [uid, userData] of Object.entries(allUsers)) {
          if (userData.email && userData.email.toLowerCase() === emailToShare.trim().toLowerCase()) {
            recipientId = uid;
            break;
          }
        }

        if (recipientId) {
          if (recipientId === currentUser.uid) {
            alert("You can't share a dashboard with yourself.");
            return;
          }
          const sharedWsRef = ref(database, `users/${recipientId}/sharedWorkspaces/${ws.id}`);
          await set(sharedWsRef, { ...ws, isShared: true, sharedBy: currentUser.email });
          alert(`Dashboard "${ws.name}" successfully shared with ${emailToShare}!`);
        } else {
          alert('User with this email not found in database.');
        }
      } else {
        alert('No users found in database.');
      }
    } catch (error) {
      console.error("Error sharing workspace:", error);
      alert('Failed to share: ' + error.message);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString();
  };

  
  let combinedWorkspaces = [];
  if (!loadingInitial) {
    if (!currentUser) {
      combinedWorkspaces = DEMO_WORKSPACES.map(w => ({ ...w, isShared: false }));
    } else {
      combinedWorkspaces = [
        ...myWorkspaces.map(w => ({ ...w, isShared: false })),
        ...sharedWorkspaceIds
      ].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
    }
  }

  return (
    <div className="dashboard">
      <nav className="landing-nav" style={{ position: 'relative', marginBottom: 24 }}>
        <div className="landing-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="landing-logo-icon">H</div>
          <span className="landing-logo-text">Higgsfield AI</span>
        </div>
        <div className="landing-nav-links">
          <span style={{color: 'rgba(255,255,255,0.7)', marginRight: '1rem'}}>
            {currentUser ? `Welcome, ${currentUser.email}` : 'Not logged in (Demo Mode)'}
          </span>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            Home
          </button>
          {!currentUser && (
             <button className="btn btn-ghost" onClick={() => navigate('/login')}>
              Login
             </button>
          )}
          <button className="btn btn-primary" onClick={handleCreateWorkspace}>
            ＋ New Workspace
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">{currentUser ? 'Your Workspaces' : 'Demo Workspaces'}</h1>
            <p className="dashboard-subtitle">
              {currentUser 
                ? 'Manage your personal collaboration spaces and those shared with you.' 
                : 'Login to create your own personal spaces and share them with team members.'}
            </p>
          </div>
        </div>

        <div className="dashboard-grid stagger-in">
          {combinedWorkspaces.map((ws) => (
            <div
              key={ws.id}
              className="workspace-card"
              id={`workspace-${ws.id}`}
              style={ws.isShared ? { border: '1px solid #10b981', boxShadow: '0 0 10px rgba(16,185,129,0.1)' } : {}}
            >
              <div className="workspace-card-header">
                <div className="workspace-card-icon">🎨</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {ws.isShared && (
                    <span className="workspace-card-badge" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>Shared with you</span>
                  )}
                  {!ws.isShared && (
                    <span className="workspace-card-badge">Active</span>
                  )}
                </div>
              </div>
              <h3>{ws.name}</h3>
              <p>{ws.description}</p>
              {ws.isShared && <p style={{fontSize: '0.8rem', color: '#10b981', marginTop: 4}}>From: {ws.sharedBy}</p>}
              
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                 {currentUser && !ws.isShared && (
                    <button 
                      className="btn btn-primary" 
                      onClick={(e) => handleShareWorkspace(e, ws)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', flex: 1, zIndex: 10 }}
                    >
                      ✉️ Share Dashboard
                    </button>
                  )}
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => navigate(`/workspace/${ws.id}`)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', flex: 1, zIndex: 10 }}
                  >
                    🚀 Open
                  </button>
              </div>

              <div className="workspace-card-footer" style={{ marginTop: '1rem' }}>
                <span>👥 {ws.memberCount || 1} members</span>
                <span>✏️ {ws.canvasElements || 0} elements</span>
                <span>🕐 {formatTime(ws.updatedAt)}</span>
              </div>
            </div>
          ))}

          <div
            className="workspace-card workspace-card-new"
            id="create-workspace"
            onClick={handleCreateWorkspace}
          >
            <div className="add-icon">＋</div>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              New Workspace
            </h3>
            <p style={{ fontSize: '0.8125rem' }}>
              Start a new collaborative canvas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
