import { useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import ExcalidrawCanvas from '../components/Canvas/ExcalidrawCanvas';
import { exportToBlob } from "@excalidraw/excalidraw";
import WorkspaceChat from '../components/Chat/WorkspaceChat';
import MeetPanel from '../components/Meet/MeetPanel';
import CalendarPanel from '../components/Calendar/CalendarPanel';
import DraggableWindow from '../components/Layout/DraggableWindow';

export default function Workspace() {
  const { id } = useParams();
  const workspaceId = id || 'default';

  const [openWindows, setOpenWindows] = useState([]);
  const [topWindow, setTopWindow] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleWindow = (winId) => {
    if (winId === 'canvas') return;
    if (openWindows.includes(winId)) {
      if (topWindow === winId) {
        setOpenWindows((w) => w.filter((x) => x !== winId));
      } else {
        setTopWindow(winId);
      }
    } else {
      setOpenWindows((w) => [...w, winId]);
      setTopWindow(winId);
    }
  };

  const excalidrawApiRef = useRef(null);

  const getCanvasData = useCallback(() => {
    if (!excalidrawApiRef.current) return null;
    try {
      const elements = excalidrawApiRef.current.getSceneElements();
      return elements;
    } catch {
      return null;
    }
  }, []);

  const getCanvasImage = useCallback(async () => {
    if (!excalidrawApiRef.current) return null;
    const elements = excalidrawApiRef.current.getSceneElements();
    if (!elements || elements.length === 0) return null;
    try {
      const blob = await exportToBlob({
        elements,
        mimeType: "image/png",
        appState: { exportBackground: true, exportWithDarkMode: true },
        files: excalidrawApiRef.current.getFiles() || {},
      });
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          resolve(reader.result.split(',')[1]); 
        };
      });
    } catch (e) {
      console.error("Failed to export canvas to image:", e);
      return null;
    }
  }, []);

  const addExternalFiles = useCallback((files, newElements) => {
    if (!excalidrawApiRef.current) return;
    try {
      if (files && files.length > 0) {
        excalidrawApiRef.current.addFiles(files);
      }
      
      const currentElements = excalidrawApiRef.current.getSceneElements();
      const elementMap = new Map(currentElements.map(el => [el.id, el]));
      
      
      newElements.forEach(el => {
        elementMap.set(el.id, {
          ...(elementMap.get(el.id) || {}),
          ...el,
          version: (elementMap.get(el.id)?.version || 0) + 1,
          versionNonce: Math.floor(Math.random() * 1000000)
        });
      });

      excalidrawApiRef.current.updateScene({ 
        elements: Array.from(elementMap.values()) 
      });
    } catch (e) {
      console.error("Failed to add external files:", e);
    }
  }, []);

  return (
    <div className="workspace-layout">
      <Sidebar
        openWindows={openWindows}
        onViewChange={toggleWindow}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      <div className="workspace-main">
        <Header
          workspaceId={workspaceId}
          activeView={'canvas'} 
        />

        <div className="canvas-container" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'block', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 1 }}>
            <ExcalidrawCanvas
              workspaceId={workspaceId}
              apiRef={excalidrawApiRef}
            />
          </div>

          {openWindows.includes('chat') && (
            <DraggableWindow 
               title="Teams Chat" icon="💬" 
               defaultSize={{ width: 400, height: 600 }} 
               defaultPos={{ x: window.innerWidth - 750, y: 50 }}
               zIndex={topWindow === 'chat' ? 50 : 10}
               onClick={() => setTopWindow('chat')}
               onClose={() => setOpenWindows(w => w.filter(x => x !== 'chat'))}
            >
              <div style={{ position: 'absolute', inset: 0 }}>
                <WorkspaceChat 
                   workspaceId={workspaceId} 
                   getCanvasImage={getCanvasImage} 
                   addExternalFiles={addExternalFiles}
                />
              </div>
            </DraggableWindow>
          )}

          {openWindows.includes('meet') && (
            <DraggableWindow 
               title="Google Meet" icon="📹" 
               defaultSize={{ width: 600, height: 450 }} 
               defaultPos={{ x: 50, y: 50 }}
               zIndex={topWindow === 'meet' ? 50 : 10}
               onClick={() => setTopWindow('meet')}
               onClose={() => setOpenWindows(w => w.filter(x => x !== 'meet'))}
            >
              <div style={{ position: 'absolute', inset: 0 }}>
                <MeetPanel />
              </div>
            </DraggableWindow>
          )}

          {openWindows.includes('calendar') && (
            <DraggableWindow 
               title="Calendar" icon="📅" 
               defaultSize={{ width: 700, height: 500 }} 
               defaultPos={{ x: 100, y: 150 }}
               zIndex={topWindow === 'calendar' ? 50 : 10}
               onClick={() => setTopWindow('calendar')}
               onClose={() => setOpenWindows(w => w.filter(x => x !== 'calendar'))}
            >
              <div style={{ position: 'absolute', inset: 0 }}>
                <CalendarPanel />
              </div>
            </DraggableWindow>
          )}
        </div>
      </div>
    </div>
  );
}
