import React, { useState, useRef, useEffect } from 'react';

export default function DraggableWindow({ title, icon, onClose, children, defaultSize, defaultPos, zIndex, onClick }) {
  const [pos, setPos] = useState(defaultPos || { x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  const startDrag = (e) => {
    if (e.target.tagName.toLowerCase() === 'button') return;
    
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: pos.x,
      initY: pos.y
    };
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging) return;
      setPos({
        x: dragRef.current.initX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.initY + (e.clientY - dragRef.current.startY)
      });
    };
    const onMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove, true);
      document.addEventListener('mouseup', onMouseUp, true);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('mouseup', onMouseUp, true);
    };
  }, [isDragging]);

  return (
    <div
      onMouseDown={onClick}
      style={{
        position: 'absolute',
        top: pos.y,
        left: pos.x,
        width: defaultSize?.width || 450,
        height: defaultSize?.height || 550,
        backgroundColor: 'rgba(26, 26, 26, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: zIndex,
        overflow: 'hidden',
        resize: 'both',
        minWidth: '300px',
        minHeight: '200px'
      }}
    >
      <div
        onMouseDown={startDrag}
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', letterSpacing: '0.02em' }}>
          <span>{icon}</span> {title}
        </div>
        <button 
           onMouseDown={(e) => { e.stopPropagation(); onClose(); }} 
           style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
           onMouseEnter={(e) => e.target.style.background = 'rgba(255,50,50,0.8)'}
           onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}
