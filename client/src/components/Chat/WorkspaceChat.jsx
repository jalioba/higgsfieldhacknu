import { useState, useEffect, useRef } from 'react';
import { database, auth } from '../../services/firebase';
import { ref, push, set, onValue, query, orderByChild } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';


export default function WorkspaceChat({ workspaceId, getCanvasImage, addExternalFiles }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [sharedUsers, setSharedUsers] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const threadsRef = ref(database, `workspaces/${workspaceId}/threads`);
    const unsub = onValue(threadsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const threadsArr = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setThreads(threadsArr);
        if (!activeThreadId && threadsArr.length > 0) {
          setActiveThreadId(threadsArr[0].id);
        }
      } else {
        createThread("General");
      }
    });

    const usersRef = ref(database, `users`);
    onValue(usersRef, (snap) => {
      if (snap.exists()) {
        const allUsers = snap.val();
        const accessUsers = [];
        for (const uid in allUsers) {
          const user = allUsers[uid];
          // If they own it or it's shared with them
          if (user.myWorkspaces?.[workspaceId] || user.sharedWorkspaces?.[workspaceId]) {
            accessUsers.push(user.email);
          }
        }
        setSharedUsers(accessUsers);
      }
    });

    return () => unsub();
  }, [workspaceId]);

  
  useEffect(() => {
    if (!activeThreadId) return;
    const msgsRef = query(ref(database, `workspaces/${workspaceId}/messages/${activeThreadId}`));
    const unsub = onValue(msgsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const msgsArr = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        msgsArr.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(msgsArr);
        scrollToBottom();
      } else {
        setMessages([]);
      }
    });
    return () => unsub();
  }, [workspaceId, activeThreadId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const createThread = async (name) => {
    if (!name.trim()) return;
    const newThreadRef = push(ref(database, `workspaces/${workspaceId}/threads`));
    await set(newThreadRef, { name, createdAt: Date.now() });
    setActiveThreadId(newThreadRef.key);
  };

  const handleCreateThread = () => {
    const name = prompt("Enter new thread name:");
    if (name) createThread(name);
  };

  const callClaudeHaiku = async (userMessage, imageBase64, botType = 'claude') => {
    try {
      const response = await fetch("http://localhost:3001/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage,
          workspaceId: workspaceId,
          imageBase64: imageBase64,
          history: messages.slice(-10),
          botType: botType
        })
      });

      if (!response.ok) {
        throw new Error(`Server Error ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error(err);
      return { reply: ` System Error: ${err.message}` };
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser || !activeThreadId) return;

    const text = inputText.trim();
    setInputText('');
    setShowMentions(false);

    // Save user message
    const msgsRef = ref(database, `workspaces/${workspaceId}/messages/${activeThreadId}`);
    const newMsgRef = push(msgsRef);
    await set(newMsgRef, {
      text,
      sender: currentUser.email,
      timestamp: Date.now()
    });

    const isClaude = text.includes('@Bot');
    const isHiggs = text.includes('@higgsBot');

    if (isClaude || isHiggs) {
      const botName = isHiggs ? "🎨 HiggsBot" : "🤖 AI Assistant";
      const botType = isHiggs ? "higgsBot" : "claude";

      const botMsgRef = push(msgsRef);
      await set(botMsgRef, {
        text: isHiggs ? "HiggsBot is preparing image... 🎨" : "Bot is typing... (Looking at canvas)",
        sender: botName,
        timestamp: Date.now()
      });
      
      const userText = text.replace('@Bot', '').replace('@higgsBot', '').trim();
      const imageBase64 = (getCanvasImage && !isHiggs) ? await getCanvasImage() : null;

      const botResult = await callClaudeHaiku(userText, imageBase64, botType);
      let finalReply = botResult.reply;

      if (botResult.higgsfieldData) {
         try {
              const { prompt, x = 100, y = 100 } = botResult.higgsfieldData;
              
              // 1. Add Placeholder to Canvas
              const placeholderId = "gen_" + Math.random().toString(36).substring(2, 9);
              const placeholderTextId = placeholderId + "_text";
              
              const placeholderEls = [
                {
                  id: placeholderId,
                  type: "rectangle",
                  x, y, width: 300, height: 300,
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                  strokeColor: "#6366f1",
                  strokeStyle: "dashed",
                  roundness: { type: 3 },
                  version: 1,
                  versionNonce: Math.floor(Math.random() * 1000000),
                  isDeleted: false
                },
                {
                  id: placeholderTextId,
                  type: "text",
                  x: x + 50, y: y + 130,
                  width: 200, height: 40,
                  text: "Claude is generating... 🎨",
                  fontSize: 20,
                  textAlign: "center",
                  strokeColor: "#6366f1",
                  version: 1,
                  versionNonce: Math.floor(Math.random() * 1000000),
                  isDeleted: false
                }
              ];
              
              if (addExternalFiles) {
                addExternalFiles([], placeholderEls);
              }

              // 2. Start Generation
              const startRes = await fetch("http://localhost:3001/api/ai/generations/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
              });
              const { jobId } = await startRes.json();

              if (jobId) {
                // 3. Polling Loop
                let imageUrl = null;
                for(let i=0; i<30; i++) { // Poll for ~1.5 minutes
                  await new Promise(r => setTimeout(r, 3000));
                  const pollRes = await fetch(`http://localhost:3001/api/ai/generations/poll/${jobId}`);
                  const pollData = await pollRes.json();
                  if (pollData.status === 'completed') {
                    imageUrl = pollData.url;
                    break;
                  } else if (pollData.status === 'failed') {
                    console.error("Generation failed");
                    break;
                  }
                }

                if (imageUrl && addExternalFiles) {
                  
                  const imgData = await fetch(imageUrl);
                  const blob = await imgData.blob();
                  const reader = new FileReader();
                  reader.readAsDataURL(blob);
                  reader.onloadend = () => {
                    const base64 = reader.result;
                    const fileId = "hf_" + Date.now();
                    const imageEl = {
                      type: "image",
                      id: Math.random().toString(36).substring(2, 9),
                      fileId: fileId,
                      x: x,
                      y: y,
                      width: 512,
                      height: 512,
                      version: 2,
                      versionNonce: Math.floor(Math.random() * 1000000),
                      isDeleted: false
                    };
                    
                    const deletePlaceholders = [
                      { id: placeholderId, isDeleted: true },
                      { id: placeholderTextId, isDeleted: true }
                    ];

                    addExternalFiles([{
                      id: fileId,
                      dataURL: base64,
                      mimeType: "image/png",
                      created: Date.now()
                    }], [...deletePlaceholders, imageEl]);
                  };
                  finalReply = finalReply + "\n*(✨ Image successfully inserted into canvas!)*";
                } else {
                   
                   if (addExternalFiles) {
                     addExternalFiles([], [
                       { id: placeholderId, isDeleted: true },
                       { id: placeholderTextId, isDeleted: true }
                     ]);
                   }
                   finalReply = finalReply + "\n*(⚠️ Higgsfield generation timed out or failed)*";
                }
              }
         } catch(e) { 
           console.error("Higgsfield flow error:", e);
           finalReply = finalReply + "\n*(❌ Error during generation)*";
         }
      }

      await set(botMsgRef, {
        text: finalReply,
        sender: "AI Assistant",
        isBot: true,
        timestamp: Date.now()
      });
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    if (val.endsWith('@')) {
      setShowMentions(true);
    } else if (!val.includes('@')) {
      setShowMentions(false);
    }
  };

  const insertMention = (mentionStr) => {
    const prefix = inputText.substring(0, inputText.lastIndexOf('@'));
    setInputText(prefix + '@' + mentionStr + ' ');
    setShowMentions(false);
  };

  return (
    <div style={{ display: 'flex', flex: 1, width: '100%', height: '100%', background: '#121212', color: '#fff', borderRadius: '8px', overflow: 'hidden' }}>

      {}
      <div style={{ width: '250px', background: '#1a1a1a', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>💬 Channels</h3>
          <button onClick={handleCreateThread} style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>+</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {threads.map(t => (
            <div
              key={t.id}
              onClick={() => setActiveThreadId(t.id)}
              style={{
                padding: '0.5rem',
                margin: '0.2rem 0',
                borderRadius: '4px',
                cursor: 'pointer',
                background: activeThreadId === t.id ? '#333' : 'transparent',
                fontWeight: activeThreadId === t.id ? 'bold' : 'normal'
              }}
            >
              # {t.name}
            </div>
          ))}
        </div>
      </div>

      {}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {}
        <div style={{ padding: '1rem', borderBottom: '1px solid #333', background: '#1a1a1a' }}>
          <h3 style={{ margin: 0 }}>
            # {threads.find(t => t.id === activeThreadId)?.name || 'Select a thread'}
          </h3>
        </div>

        {}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!currentUser && <div style={{ textAlign: 'center', color: '#888' }}>Please log in to participate in the chat.</div>}

          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === currentUser?.email ? 'flex-end' : 'flex-start' }}>
              <span style={{ fontSize: '0.75rem', color: msg.isBot ? '#10b981' : '#888', marginBottom: '0.2rem' }}>
                {msg.sender}
              </span>
              <div style={{
                background: msg.sender === currentUser?.email ? '#6366f1' : msg.isBot ? 'rgba(16,185,129,0.1)' : '#333',
                border: msg.isBot ? '1px solid #10b981' : 'none',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                maxWidth: '70%',
                wordBreak: 'break-word'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {}
        {showMentions && (
          <div style={{
            position: 'absolute',
            bottom: '70px',
            left: '1rem',
            background: '#222',
            border: '1px solid #444',
            borderRadius: '8px',
            width: '200px',
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '0.5rem',
            zIndex: 10
          }}>
            <div onClick={() => insertMention('Bot')} style={{ padding: '0.5rem', cursor: 'pointer', background: '#333', borderRadius: '4px', marginBottom: '4px' }}>
              🤖 @Bot (AI Claude)
            </div>
            <div onClick={() => insertMention('higgsBot')} style={{ padding: '0.5rem', cursor: 'pointer', background: '#333', borderRadius: '4px', marginBottom: '4px' }}>
              🎨 @higgsBot (Image Gen)
            </div>
            {sharedUsers.map(email => (
              email !== currentUser?.email && (
                <div key={email} onClick={() => insertMention(email.split('@')[0])} style={{ padding: '0.5rem', cursor: 'pointer' }}>
                  👤 @{email.split('@')[0]}
                </div>
              )
            ))}
          </div>
        )}

        {}
        <div style={{ padding: '1rem', background: '#1a1a1a', borderTop: '1px solid #333' }}>
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Message... Type @ to mention bot or users"
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff' }}
              disabled={!currentUser}
            />
            <button type="submit" className="btn btn-primary" disabled={!currentUser || !inputText.trim()}>
              Send
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
