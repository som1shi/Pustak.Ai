import React, { useState } from 'react';
import EpubReader from './components/EpubReader';
import FileUpload from './components/FileUpload';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);

  return (
    <div>
      {selectedFile ? (
        <EpubReader file={selectedFile} />
      ) : (
        <FileUpload onFileSelect={setSelectedFile} />
      )}
    </div>
  );
}

export default App; 