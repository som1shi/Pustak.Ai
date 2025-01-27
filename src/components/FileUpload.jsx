import React from 'react';
import './FileUpload.css';

const FileUpload = ({ onFileSelect }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/epub+zip') {
      onFileSelect(file);
    } else {
      alert('Please select a valid EPUB file');
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-box">
        <h2>EPUB Reader</h2>
        <p>Upload your EPUB file to start reading</p>
        <label className="upload-button">
          Select EPUB File
          <input
            type="file"
            accept=".epub"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  );
};

export default FileUpload; 