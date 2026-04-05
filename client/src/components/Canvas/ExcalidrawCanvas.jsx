import React, { useEffect, useState, useRef, useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { database } from "../../services/firebase";
import { ref, onValue, set } from "firebase/database";

export default function ExcalidrawCanvas({ workspaceId, apiRef }) {
  const [initialData, setInitialData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    const canvasRef = ref(database, `workspaces/${workspaceId}/canvas`);
    const unsub = onValue(canvasRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : {};
      const newElements = Array.isArray(data?.elements) ? data.elements : [];
      const newFiles = data?.files || {};
      
      if (!loaded) {
        setInitialData({ 
          elements: newElements,
          files: newFiles 
        });
        setLoaded(true);
      } else if (apiRef.current) {
        try {
           const localElements = apiRef.current.getSceneElements();
           const localStr = JSON.stringify(localElements.map(el => el.version));
           const remoteStr = JSON.stringify(newElements.map(el => el.version));
           
           if (localStr !== remoteStr) {
             apiRef.current.updateScene({ elements: newElements });
             
             if (Object.keys(newFiles).length > 0) {
                apiRef.current.addFiles(Object.values(newFiles));
             }
           }
        } catch (e) {
           console.error("Excalidraw updateScene error:", e);
        }
      }
    });
    return () => unsub();
  }, [workspaceId, loaded, apiRef]);

  const handleChange = useCallback((elements, appState, files) => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      if (!apiRef.current) return;
      
      const canvasRef = ref(database, `workspaces/${workspaceId}/canvas`);
      
      const cleanedElements = JSON.parse(JSON.stringify(elements));
      
      set(canvasRef, {
        elements: cleanedElements,
        files: files || {}
      }).catch(err => console.error('Error saving to Firebase:', err));
    }, 1500);
  }, [workspaceId]);

  return (
    <div className="excalidraw-wrapper" style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}>
      {loaded && (
        <Excalidraw
          theme="dark"
          excalidrawAPI={(api) => {
            if (apiRef) apiRef.current = api;
          }}
          initialData={initialData}
          onChange={handleChange}
        />
      )}
    </div>
  );
}
