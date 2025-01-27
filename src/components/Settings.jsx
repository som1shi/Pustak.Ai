import React from 'react';
import { FiX } from 'react-icons/fi';
import './Settings.css';

const THEMES = [
  { name: 'White', value: '#ffffff', textColor: '#000000' },
  { name: 'Sepia', value: '#f6f3e3', textColor: '#000000' },
  { name: 'Gray', value: '#464646', textColor: '#ffffff' },
  { name: 'Black', value: '#000000', textColor: '#ffffff' },
];

const FONT_FAMILIES = [
  { name: 'San Francisco', value: '-apple-system, BlinkMacSystemFont, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Athelas', value: 'Athelas, serif' },
  { name: 'Charter', value: 'Charter, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Iowan', value: 'Iowan Old Style, serif' },
  { name: 'New York', value: 'New York, serif' },
  { name: 'Palatino', value: 'Palatino, serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Open Sans', value: "'Open Sans', sans-serif" },
  { name: 'Montserrat', value: "'Montserrat', sans-serif" },
  { name: 'Luciole', value: "'Luciole', sans-serif" },
  { name: 'OpenDyslexic', value: "'OpenDyslexic', sans-serif" }
];

const Settings = ({ isOpen, onClose, settings, onSettingsChange }) => {
  if (!isOpen) return null;

  const handleThemeChange = (theme) => {
    onSettingsChange({ ...settings, bgColor: theme.value });
  };

  const handleFontChange = (e) => {
    onSettingsChange({ ...settings, fontFamily: e.target.value });
  };

  const handleFontSizeChange = (direction) => {
    const sizes = [80, 100, 120, 140, 160]; // Percentage-based sizes
    const currentIndex = sizes.indexOf(settings.fontSize);
    const newIndex = direction === 'increase' 
      ? Math.min(currentIndex + 1, sizes.length - 1)
      : Math.max(currentIndex - 1, 0);
    onSettingsChange({ ...settings, fontSize: sizes[newIndex] });
  };

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Display</h2>
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <div className="settings-content">
          <div className="setting-group themes">
            <div className="theme-circles">
              {THEMES.map(theme => (
                <button
                  key={theme.value}
                  className={`theme-circle ${settings.bgColor === theme.value ? 'active' : ''}`}
                  style={{ backgroundColor: theme.value }}
                  onClick={() => handleThemeChange(theme)}
                >
                  {settings.bgColor === theme.value && <span className="checkmark">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group font-size">
            <button 
              className="size-button" 
              onClick={() => handleFontSizeChange('decrease')}
            >
              Aa
            </button>
            <div className="size-slider">
              <div className="size-track" />
              <div 
                className="size-fill" 
                style={{ 
                  width: `${((settings.fontSize - 80) / (160 - 80)) * 100}%` 
                }}
              />
            </div>
            <button 
              className="size-button large" 
              onClick={() => handleFontSizeChange('increase')}
            >
              Aa
            </button>
          </div>

          <div className="setting-group fonts">
            <label className="font-label">Font</label>
            <div className="font-select-wrapper">
              <select 
                value={settings.fontFamily} 
                onChange={handleFontChange}
                className="font-select"
              >
                {FONT_FAMILIES.map(font => (
                  <option 
                    key={font.value} 
                    value={font.value}
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 