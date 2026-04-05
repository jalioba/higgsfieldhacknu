import { useState, useEffect, useMemo } from 'react';
import { getEvents, createEvent } from '../../services/api';

const DEMO_EVENTS = [
  {
    id: 'e1',
    title: 'Team Standup',
    start: todayAt(9, 0),
    end: todayAt(9, 30),
    hasMeet: true,
    meetLink: 'https://meet.google.com/new',
  },
  {
    id: 'e2',
    title: 'Design Review',
    start: todayAt(14, 0),
    end: todayAt(15, 0),
    hasMeet: true,
    meetLink: 'https://meet.google.com/new',
  },
  {
    id: 'e3',
    title: 'Sprint Retro',
    start: tomorrowAt(11, 0),
    end: tomorrowAt(12, 0),
    hasMeet: false,
  },
];

function todayAt(h, m) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function tomorrowAt(h, m) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export default function CalendarPanel() {
  const [events, setEvents] = useState(DEMO_EVENTS);
  const [showCreate, setShowCreate] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    addMeet: true,
  });

  useEffect(() => {
    getEvents()
      .then((data) => {
        if (data && data.length > 0) setEvents(data);
      })
      .catch(() => {});
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const days = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrev - i, otherMonth: true, date: new Date(year, month - 1, daysInPrev - i) });
    }

    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isToday = date.toDateString() === today.toDateString();
      const hasEvent = events.some((e) => new Date(e.start).toDateString() === date.toDateString());
      days.push({ day: d, otherMonth: false, isToday, hasEvent, date });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, otherMonth: true, date: new Date(year, month + 1, d) });
    }

    return days;
  }, [currentMonth, events]);

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const changeMonth = (delta) => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  };

  const handleCreateEvent = async () => {
    if (!form.title.trim()) return;
    const start = `${form.date}T${form.startTime}:00`;
    const end = `${form.date}T${form.endTime}:00`;

    try {
      const ev = await createEvent({
        title: form.title,
        start,
        end,
        addMeet: form.addMeet,
      });
      setEvents((prev) => [...prev, ev]);
    } catch {
      const mock = {
        id: `e-${Date.now()}`,
        title: form.title,
        start,
        end,
        hasMeet: form.addMeet,
        meetLink: form.addMeet ? 'https://meet.google.com/new' : null,
      };
      setEvents((prev) => [...prev, mock]);
    }

    setShowCreate(false);
    setForm({ title: '', date: new Date().toISOString().split('T')[0], startTime: '10:00', endTime: '11:00', addMeet: true });
  };

  const upcomingEvents = [...events]
    .filter((e) => new Date(e.start) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  return (
    <div className="calendar-panel">
      {}
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
         <strong>Google Calendar not connected.</strong> Add Google OAuth credentials to enable real calendar sync. Showing demo events.
      </div>

      {}
      <div className="calendar-mini">
        <div className="calendar-mini-header">
          <h3 className="calendar-mini-title">{monthLabel}</h3>
          <div className="calendar-mini-nav">
            <button className="btn btn-icon btn-ghost" onClick={() => changeMonth(-1)}>‹</button>
            <button className="btn btn-icon btn-ghost" onClick={() => changeMonth(1)}>›</button>
          </div>
        </div>

        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="calendar-weekday">{d}</div>
          ))}
        </div>

        <div className="calendar-days">
          {calendarDays.map((d, i) => (
            <div
              key={i}
              className={`calendar-day ${d.isToday ? 'today' : ''} ${d.otherMonth ? 'other-month' : ''} ${d.hasEvent ? 'has-event' : ''}`}
              onClick={() => {
                const tzoffset = d.date.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(d.date - tzoffset)).toISOString().split('T')[0];
                setForm(f => ({ ...f, date: localISOTime }));
                setShowCreate(true);
              }}
              style={{ cursor: 'pointer' }}
            >
              {d.day}
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="events-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="events-section-title" style={{ margin: 0 }}>Upcoming Events</h3>
          <button className="btn btn-primary btn-sm" id="create-event-btn" onClick={() => setShowCreate(true)}>
            ＋ New Event
          </button>
        </div>

        <div className="stagger-in">
          {upcomingEvents.map((ev) => {
            const start = new Date(ev.start);
            const hours = start.getHours();
            const displayHour = hours > 12 ? hours - 12 : hours || 12;
            const meridiem = hours >= 12 ? 'PM' : 'AM';

            return (
              <div key={ev.id} className="event-item">
                <div className="event-time-block">
                  <span className="event-time-hour">{displayHour}:{String(start.getMinutes()).padStart(2, '0')}</span>
                  <span className="event-time-meridiem">{meridiem}</span>
                </div>
                <div className="event-details">
                  <div className="event-title">{ev.title}</div>
                  <div className="event-meta">
                    {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' · '}
                    {new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' — '}
                    {new Date(ev.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {ev.hasMeet && (
                    <div className="event-meet-badge">
                      📹 Google Meet attached
                    </div>
                  )}
                </div>
                {ev.hasMeet && ev.meetLink && (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => window.open(ev.meetLink, '_blank')}
                    style={{ alignSelf: 'center' }}
                  >
                    Join
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {upcomingEvents.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"></div>
            <h3>No upcoming events</h3>
            <p>Schedule a new event to get started.</p>
          </div>
        )}
      </div>

      {}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Event</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowCreate(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Event Title</label>
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Sprint Planning"
                id="event-title-input"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                id="event-date-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  id="event-start-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  id="event-end-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={form.addMeet}
                  onChange={(e) => setForm({ ...form, addMeet: e.target.checked })}
                />
                Auto-attach Google Meet link
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" id="confirm-create-event" onClick={handleCreateEvent}>
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateCode() {
  const c = 'abcdefghijklmnopqrstuvwxyz';
  const p = () => Array.from({ length: 3 }, () => c[Math.floor(Math.random() * c.length)]).join('');
  return `${p()}-${p()}-${p()}`;
}
