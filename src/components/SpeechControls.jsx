import React, { useState, useEffect } from 'react';
import './SpeechControls.css';

const SpeechControls = ({ text, onStateChange, isPlaying: externalIsPlaying }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [utterance, setUtterance] = useState(null);
  const [speed, setSpeed] = useState(1.0); // Default speed

  useEffect(() => {
    // Get available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      setSelectedVoice(availableVoices[0]);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Sync with external playing state
  useEffect(() => {
    setIsPlaying(externalIsPlaying);
  }, [externalIsPlaying]);

  useEffect(() => {
    if (text) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const newUtterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        newUtterance.voice = selectedVoice;
      }
      newUtterance.rate = speed;
      newUtterance.onend = () => {
        setIsPlaying(false);
        onStateChange(false);
      };
      setUtterance(newUtterance);

      // Auto-play if it was already playing
      if (isPlaying) {
        window.speechSynthesis.speak(newUtterance);
      }
    }
  }, [text, selectedVoice, speed, isPlaying, onStateChange]);

  const toggleSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      onStateChange(false);
    } else if (utterance) {
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      onStateChange(true);
    }
  };

  const handleVoiceChange = (event) => {
    const voice = voices.find(v => v.name === event.target.value);
    setSelectedVoice(voice);
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleSpeedChange = (event) => {
    const newSpeed = parseFloat(event.target.value);
    setSpeed(newSpeed);
  };

  return (
    <div className="speech-controls">
      <button 
        onClick={toggleSpeech}
        className="speech-button"
      >
        {isPlaying ? '⏸️ Pause' : '▶️ Play'}
      </button>
      
      <select 
        value={selectedVoice?.name || ''} 
        onChange={handleVoiceChange}
        className="voice-select"
      >
        {voices.map(voice => (
          <option key={voice.name} value={voice.name}>
            {`${voice.name} (${voice.lang})`}
          </option>
        ))}
      </select>

      <div className="speed-control">
        <label>Speed: </label>
        <select 
          value={speed} 
          onChange={handleSpeedChange}
          className="speed-select"
        >
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1.0">1.0x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="1.75">1.75x</option>
          <option value="2.0">2.0x</option>
        </select>
      </div>
    </div>
  );
};

export default SpeechControls;
