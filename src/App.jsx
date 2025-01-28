import React, { useState } from 'react';
import BookLanding from './components/BookLanding';
import EpubReader from './components/EpubReader';
import './App.css';

function App() {
  const [file, setFile] = useState(null);

  return (
    <div className="app">
      {!file ? (
        <BookLanding onFileSelect={setFile} />
      ) : (
        <EpubReader file={file} />
      )}
    </div>
  );
}

export default App; 