import { useNavigate } from 'react-router-dom';

export default function Sidebar({ openWindows, onViewChange, collapsed, onToggle }) {
  const navigate = useNavigate();

  const navItems = [
    { id: 'canvas', icon: '', label: 'Canvas', badge: null },
    { id: 'chat', icon: '', label: 'Teams Chat', badge: null },
    { id: 'meet', icon: '', label: 'Google Meet', badge: null },
    { id: 'calendar', icon: '', label: 'Calendar', badge: null },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div
          className="sidebar-logo"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
          title="Home"
        >
          H
        </div>
        {!collapsed && <span className="sidebar-brand">Higgsfield AI</span>}
        <button
          className="btn btn-icon btn-ghost"
          onClick={onToggle}
          style={{ marginLeft: 'auto' }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-content">
        <p className="sidebar-section-title">Workspace</p>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-link ${(item.id === 'canvas' || openWindows.includes(item.id)) ? 'active' : ''}`}
            id={`nav-${item.id}`}
            onClick={() => onViewChange(item.id)}
          >
            <span className="nav-link-icon">{item.icon}</span>
            <span className="nav-link-text">{item.label}</span>
            {item.badge && <span className="nav-link-badge">{item.badge}</span>}
          </button>
        ))}

        <p className="sidebar-section-title">Navigation</p>
        <button
          className="nav-link"
          id="nav-dashboard"
          onClick={() => navigate('/dashboard')}
        >
          <span className="nav-link-icon"></span>
          <span className="nav-link-text">Dashboard</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">T</div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Team Member</div>
              <div className="sidebar-user-status">Online</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
