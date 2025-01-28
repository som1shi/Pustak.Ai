import React, { useState } from 'react';
import BookLanding from './components/BookLanding';
import BookLibrary from './components/BookLibrary';
import EpubReader from './components/EpubReader';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'library', or 'reader'
  const [selectedBook, setSelectedBook] = useState(null);

  const handleStartReading = () => {
    setCurrentView('library');
  };

  const handleBookSelect = async (bookPath) => {
    try {
      const response = await fetch(bookPath);
      const blob = await response.blob();
      const file = new File([blob], bookPath.split('/').pop(), { 
        type: 'application/epub+zip' 
      });
      setSelectedBook(file);
      setCurrentView('reader');
    } catch (error) {
      console.error('Error loading book:', error);
    }
  };

  const handleFileUpload = (file) => {
    setSelectedBook(file);
    setCurrentView('reader');
  };

  return (
    <div className="app">
      {currentView === 'landing' && (
        <BookLanding onStartReading={handleStartReading} />
      )}
      {currentView === 'library' && (
        <BookLibrary 
          onBookSelect={handleBookSelect}
          onFileUpload={handleFileUpload}
        />
      )}
      {currentView === 'reader' && selectedBook && (
        <EpubReader file={selectedBook} />
      )}
    </div>
  );
}

export default App; 