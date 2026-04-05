import { useState, useEffect } from 'react';
import { getMeetings, createMeeting } from '../../services/api';

const DEMO_MEETINGS = [
  {
    id: 'm1',
    title: 'Daily Standup',
    link: 'https://meet.google.com/new',
    status: 'active',
    createdAt: new Date().toISOString(),
    participants: 4,
  },
  {
    id: 'm2',
    title: 'Sprint Review',
    link: 'https://meet.google.com/new',
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 3600000 * 2).toISOString(),
    createdAt: new Date().toISOString(),
    participants: 6,
  },
];

export default function MeetPanel() {
  const [meetings, setMeetings] = useState(DEMO_MEETINGS);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    getMeetings()
      .then((data) => {
        if (data && data.length > 0) setMeetings(data);
      })
      .catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const meeting = await createMeeting({ title: newTitle });
      setMeetings((prev) => [meeting, ...prev]);
    } catch {

      const mock = {
        id: `m-${Date.now()}`,
        title: newTitle,
        link: `https://meet.google.com/${generateMeetCode()}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        participants: 1,
      };
      setMeetings((prev) => [mock, ...prev]);
    }
    setNewTitle('');
    setShowCreate(false);
  };

  const copyLink = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="meet-panel">
      <div className="meet-panel-header">
        <h2 className="meet-panel-title">Google Meet</h2>
        <button
          className="btn btn-primary"
          id="create-meeting-btn"
          onClick={() => setShowCreate(true)}
        >
          ＋ New Meeting
        </button>
      </div>

      {/* Google Auth Notice */}
      <div style={{
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(251, 191, 36, 0.08)',
        border: '1px solid rgba(251, 191, 36, 0.2)',
        marginBottom: 24,
        fontSize: '0.8125rem',
        color: 'var(--amber-400)',
        lineHeight: 1.6,
      }}>
        ⚠️ <strong>Google OAuth not configured.</strong> Add your Google Cloud credentials to <code style={{ 
          padding: '1px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.3)' 
        }}>server/.env</code> to enable real Google Meet integration. Currently showing demo data.
      </div>

      {}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Meeting</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="new-meeting-form">
              <div className="form-group">
                <label className="form-label">Meeting Title</label>
                <input
                  className="form-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Team Brainstorm"
                  id="meeting-title-input"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" id="confirm-create-meeting" onClick={handleCreate}>
                Create Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      <div className="stagger-in">
        {meetings.map((m) => (
          <div key={m.id} className="meeting-card">
            <div className="meeting-card-header">
              <div>
                <div className="meeting-card-title">{m.title}</div>
                <div className="meeting-card-time">
                  {m.status === 'active'
                    ? `Started ${new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : `Scheduled: ${new Date(m.scheduledAt || m.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                  }
                  {' · '}{m.participants} participant{m.participants !== 1 ? 's' : ''}
                </div>
              </div>
              <span className={`meeting-card-status ${m.status}`}>
                {m.status === 'active' ? '● Live' : '◷ Scheduled'}
              </span>
            </div>

            <div className="meeting-link">
              <span>🔗</span>
              <span>{m.link}</span>
            </div>

            <div className="meeting-card-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => window.open(m.link, '_blank')}
              >
                Join Meeting
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => copyLink(m.link, m.id)}
              >
                {copied === m.id ? '✓ Copied!' : '📋 Copy Link'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {meetings.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📹</div>
          <h3>No meetings yet</h3>
          <p>Create a new meeting to get started with your team collaboration.</p>
        </div>
      )}
    </div>
  );
}

function generateMeetCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part = () => Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part()}-${part()}-${part()}`;
}
