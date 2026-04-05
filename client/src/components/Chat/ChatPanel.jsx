import { useState, useRef, useEffect } from 'react';
import { aiChat } from '../../services/api';

export default function ChatPanel({ open, onClose, getCanvasData }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'ai',
      text: 'Hey!  I\'m your AI assistant. I can help you brainstorm ideas, analyze your canvas drawings, and assist with your project. Ask me anything!',
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [includeCanvas, setIncludeCanvas] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const canvasData = includeCanvas ? getCanvasData?.() : null;
      const history = messages.map((m) => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text,
      }));

      const response = await aiChat(text, canvasData, history);

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: response.reply || response.message || 'I received your message but the AI service is not configured yet. Please add the API key to get started!',
          time: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: `🔧 AI service is not connected yet. To enable AI assistant:\n\n1. Add your API key to \`server/.env\`\n2. Set \`AI_API_BASE_URL\` to the correct endpoint\n3. Restart the server\n\nIn the meantime, I'm here as a placeholder! Your message was: "${text}"`,
          time: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`chat-panel ${open ? 'open' : ''}`} id="chat-panel">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-ai-avatar">🤖</div>
          <div>
            <div className="chat-ai-name">AI Assistant</div>
            <div className="chat-ai-status">
              {isTyping ? 'Typing...' : 'Online'}
            </div>
          </div>
        </div>
        <button className="btn btn-icon btn-ghost" onClick={onClose} title="Close chat">
          ✕
        </button>
      </div>

      <div className="chat-messages" id="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.role === 'ai' ? 'ai' : 'user'}`}>
            <div className="chat-message-bubble">
              {msg.text.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < msg.text.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
            <div className="chat-message-time">{formatTime(msg.time)}</div>
          </div>
        ))}

        {isTyping && (
          <div className="chat-message ai">
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the AI assistant..."
            rows={1}
            id="chat-input"
          />
          <button
            className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
            onClick={sendMessage}
            disabled={!input.trim()}
            id="chat-send"
          >
            ↑
          </button>
        </div>
        <label
          className={`chat-context-toggle ${includeCanvas ? 'active' : ''}`}
          onClick={() => setIncludeCanvas((v) => !v)}
        >
          {includeCanvas ? 'Canvas context ON' : 'Canvas context OFF'}
        </label>
      </div>
    </div>
  );
}
