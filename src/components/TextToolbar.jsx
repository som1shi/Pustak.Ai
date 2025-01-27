import React, { useEffect, useState } from 'react';
import { FiType, FiBold, FiMessageCircle } from 'react-icons/fi';
import './TextToolbar.css';

const TextToolbar = ({ onHighlight, onBold, onComment, highlightColor, onColorChange }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setPosition({
          top: rect.top - 50, // Position above the selection
          left: rect.left + (rect.width / 2) - 100 // Center horizontally
        });
      }
    };

    document.addEventListener('selectionchange', updatePosition);
    return () => document.removeEventListener('selectionchange', updatePosition);
  }, []);

  return (
    <div 
      className="text-toolbar"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px` 
      }}
    >
      <button onClick={onHighlight} className="toolbar-button">
        <FiType />
        <input
          type="color"
          value={highlightColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="color-picker-mini"
        />
      </button>
      <button onClick={onBold} className="toolbar-button">
        <FiBold />
      </button>
      <button onClick={onComment} className="toolbar-button">
        <FiMessageCircle />
      </button>
    </div>
  );
};

export default TextToolbar; 