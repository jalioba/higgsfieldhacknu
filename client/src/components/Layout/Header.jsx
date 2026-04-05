export default function Header({ workspaceId, activeView }) {
  const viewLabels = {
    canvas: '🎨 Canvas',
    chat: '💬 Teams Chat',
    meet: '📹 Google Meet',
    calendar: '📅 Calendar',
  };

  return (
    <header className="workspace-header" id="workspace-header">
      <div className="workspace-header-left">
        <h2 className="workspace-header-title">{viewLabels[activeView] || 'Workspace'}</h2>
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-tertiary)',
        }}>
          {workspaceId}
        </span>
      </div>
      <div className="workspace-header-right">
        {}
      </div>
    </header>
  );
}
