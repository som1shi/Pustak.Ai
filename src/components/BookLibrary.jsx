import React, { useState, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import ePub from 'epubjs';
import './BookLibrary.css';

const BookLibrary = ({ onBookSelect, onFileUpload }) => {
  const [bookCovers, setBookCovers] = useState({});
  const [books, setBooks] = useState([]);

  useEffect(() => {
    // Use Vite's import.meta.glob to get all epub files
    const epubFiles = import.meta.glob('/src/assets/books/*.epub', { eager: true });
    
    // Convert the files to our desired format
    const bookList = Object.entries(epubFiles).map(([path]) => {
      const fileName = path.split('/').pop().replace('.epub', '');
      const title = fileName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return {
        title,
        path,
        cover: null
      };
    });

    setBooks(bookList);

    // Load book covers
    bookList.forEach(async (book) => {
      try {
        const response = await fetch(book.path);
        const blob = await response.blob();
        const epubBook = ePub(blob);
        await epubBook.ready;
        
        const coverUrl = await epubBook.coverUrl();
        
        if (coverUrl) {
          setBookCovers(prev => ({
            ...prev,
            [book.title]: coverUrl
          }));
        }
        
        epubBook.destroy();
      } catch (error) {
        console.error(`Error loading cover for ${book.title}:`, error);
      }
    });
  }, []);

  const booksWithCovers = books.map(book => ({
    ...book,
    cover: bookCovers[book.title]
  }));

  return (
    <div className="library-container">
      <h1>Your Library</h1>
      <div className="books-grid">
        {booksWithCovers.map((book) => (
          <div 
            key={book.path} 
            className="book-card"
            onClick={() => onBookSelect(book.path)}
          >
            <div className="book-cover">
              <span className="book-spine"></span>
              {book.cover ? (
                <img 
                  src={book.cover} 
                  alt={book.title}
                  className="book-cover-image"
                />
              ) : (
                <div className="book-title-overlay">{book.title[0]}</div>
              )}
            </div>
            <p className="book-title">{book.title}</p>
          </div>
        ))}
        <label className="book-card add-book">
          <input
            type="file"
            accept=".epub"
            onChange={(e) => onFileUpload(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <div className="book-cover">
            <span className="book-spine"></span>
            <FiPlus className="add-icon" />
          </div>
          <p className="book-title">Add Book</p>
        </label>
      </div>
    </div>
  );
};

export default BookLibrary; 