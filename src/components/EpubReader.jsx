import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight, FiMenu, FiSettings, FiX } from 'react-icons/fi';
import { FaHighlighter, FaComment, FaBold, FaUnderline } from 'react-icons/fa';
import ePub from 'epubjs';
import Settings from './Settings';
import './EpubReader.css';
import { debounce } from 'lodash';

const getContrastColor = (hexcolor) => {
  // If no color provided, return black
  if (!hexcolor) return '#000000';
  
  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, dark gray for light backgrounds
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
};

const EpubReader = ({ file }) => {
  const [book, setBook] = useState(null);
  const [rendition, setRendition] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(0);
  const [totalLocations, setTotalLocations] = useState(0);
  const viewerRef = useRef(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    fontFamily: 'inherit',
    fontSize: 100,
    bgColor: '#F5E6D3'
  });
  const [highlights, setHighlights] = useState([]);
  const [selectionPopup, setSelectionPopup] = useState({ show: false, x: 0, y: 0 });
  const [selectedRange, setSelectedRange] = useState(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(false);
  const [isGeneratingLocations, setIsGeneratingLocations] = useState(false);

  // Move this before the useEffect
  const debouncedSetPopup = useCallback(
    debounce((show, x, y) => {
      setSelectionPopup({ show, x, y });
    }, 100),
    []
  );

  // Move setupIframe function outside of useEffect
  const setupIframe = (iframe) => {
    if (!iframe) return;
    
    // Remove existing sandbox attribute
    iframe.removeAttribute('sandbox');
    
    // Add sandbox with required permissions
    iframe.setAttribute(
      'sandbox', 
      'allow-same-origin allow-scripts allow-popups'
    );
  };

  // First, remove these lines that are outside of any effect:
  // document.addEventListener('mousedown', handleClickOutside);
  // rendition.on('selected', (cfiRange, contents) => { ... });

  // Then update the main initialization useEffect:
  useEffect(() => {
    if (!file || !viewerRef.current) return;

    // Create new book instance
    const book = ePub(file);
    setBook(book);

    // Generate locations for accurate progress tracking
    book.ready.then(() => {
      book.locations.generate().then(() => {
        setTotalLocations(book.locations.total);
        
        // Save locations to localStorage to avoid regenerating
        try {
          localStorage.setItem(`${file.name}-locations`, JSON.stringify(book.locations.save()));
        } catch (error) {
          console.error('Error saving locations:', error);
        }
      });
    });

    // Create rendition
    const rendition = book.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      spread: 'none',
      allowScriptedContent: true,
      script: true,
      minSpreadWidth: 1000,
      manager: 'continuous'
    });

    // Display first page
    rendition.display().then(() => {
      // Setup initial iframe
      const iframe = viewerRef.current?.querySelector('iframe');
      if (iframe) {
        setupIframe(iframe);
      }

      // Update location handler to use generated locations
      rendition.on('locationChanged', (location) => {
        const currentLoc = book.locations.currentLocation();
        const percentage = (currentLoc / book.locations.total) * 100;
        setCurrentLocation(percentage || 0);
      });

      // Set up text selection handler
      rendition.on('selected', (cfiRange, contents) => {
        const selection = contents.window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Get iframe position to adjust coordinates
        const iframe = contents.document.defaultView.frameElement;
        const iframeRect = iframe.getBoundingClientRect();
        
        // Calculate absolute position considering iframe offset
        const position = {
          x: rect.right + iframeRect.left,
          y: rect.bottom + iframeRect.top + 5
        };

        // Create selection info first
        const selectionInfo = {
          cfiRange,
          contents,
          text: selection.toString(),
          range
        };

        // Set states in order
        setSelectedRange(selectionInfo);
        setPopupPosition(position);
        debouncedSetPopup(true, position.x, position.y);
      });

      // Handle highlight clicks
      rendition.on('markClicked', (cfiRange) => {
        rendition.annotations.remove(cfiRange, 'highlight');
        setHighlights(prev => prev.filter(h => h.cfiRange !== cfiRange));
      });
    });

    setRendition(rendition);

    // Add click outside handler
    const handleClickOutside = (e) => {
      if (!e.target.closest('.selection-popup') && !e.target.closest('.comment-input-popup')) {
        setSelectionPopup({ show: false, x: 0, y: 0 });
        setSelectedRange(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Add transition styles to the content
    rendition.hooks.content.register(contents => {
      contents.addStylesheetRules({
        'body': {
          'transition': 'transform 0.25s ease-out !important'
        },
        '.epub-container': {
          'transition': 'opacity 0.25s ease-out !important'
        },
        'mark[data-epubjs-annotation="bold"]': {
          'font-weight': '700 !important',
          'background-color': 'transparent !important',
          'mix-blend-mode': 'normal'
        },
        'mark[data-epubjs-annotation="underline"]': {
          'text-decoration': 'underline !important',
          'text-decoration-thickness': '1px',
          'background-color': 'transparent !important',
          'mix-blend-mode': 'normal'
        }
      });
    });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (book) {
        book.destroy();
      }
    };
  }, [file, debouncedSetPopup]);

  // Separate useEffect for iframe handling
  useEffect(() => {
    if (!rendition) return;

    // Handle new iframes created during navigation
    rendition.hooks.content.register(contents => {
      const iframe = contents.document.defaultView.frameElement;
      if (iframe) {
        setupIframe(iframe);
      }
    });

    // Handle iframe creation
    rendition.on('rendered', (section, view) => {
      const iframe = viewerRef.current?.querySelector('iframe');
      if (iframe) {
        setupIframe(iframe);
      }
    });
  }, [rendition]);

  useEffect(() => {
    if (!rendition) return;

    const textColor = getContrastColor(settings.bgColor);

    // Apply font size as a percentage scale and dynamic text color
    rendition.themes.default({
      body: {
        'font-family': settings.fontFamily,
        'background-color': settings.bgColor,
        color: textColor,
        'font-size': `${settings.fontSize}%`
      },
      p: {
        color: textColor
      },
      span: {
        color: textColor
      },
      h1: {
        color: textColor
      },
      h2: {
        color: textColor
      },
      h3: {
        color: textColor
      },
      h4: {
        color: textColor
      },
      h5: {
        color: textColor
      },
      h6: {
        color: textColor
      }
    });

  }, [rendition, settings]);

  useEffect(() => {
    if (rendition && highlights.length > 0) {
      try {
        localStorage.setItem('epub-highlights', JSON.stringify(highlights));
      } catch (error) {
        console.error('Error saving highlights:', error);
      }
    }
  }, [highlights, rendition]);

  useEffect(() => {
    if (rendition) {
      try {
        const savedHighlights = localStorage.getItem('epub-highlights');
        if (savedHighlights) {
          const hl = JSON.parse(savedHighlights);
          setHighlights(hl);
          
          hl.forEach(highlight => {
            rendition.annotations.add(
              'highlight', 
              highlight.cfiRange, 
              {}, 
              null, 
              'hl', 
              { 
                fill: highlight.color, 
                'fill-opacity': highlight.opacity,
                'mix-blend-mode': 'multiply'
              }
            );
          });
        }
      } catch (error) {
        console.error('Error loading highlights:', error);
      }
    }
  }, [rendition]);

  // Update the navigation handlers with slightly slower transitions
  const handlePrevPage = () => {
    if (!rendition) return;
    
    const iframe = viewerRef.current?.querySelector('iframe');
    if (iframe) {
      iframe.style.opacity = '0';
      setTimeout(() => {
        rendition.prev();
        setTimeout(() => {
          iframe.style.opacity = '1';
        }, 40); // Increased from 30
      }, 200); // Increased from 150
    } else {
      rendition.prev();
    }
  };

  const handleNextPage = () => {
    if (!rendition) return;
    
    const iframe = viewerRef.current?.querySelector('iframe');
    if (iframe) {
      iframe.style.opacity = '0';
      setTimeout(() => {
        rendition.next();
        setTimeout(() => {
          iframe.style.opacity = '1';
        }, 40); // Increased from 30
      }, 200); // Increased from 150
    } else {
      rendition.next();
    }
  };

  // Update the keyboard navigation useEffect
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!rendition) return;
      
      // Navigation shortcuts
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        rendition.prev();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        rendition.next();
      }

      // Highlight shortcut (Ctrl + H)
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        if (selectedRange) {
          handleHighlight();
        }
      }

      // Comment shortcut (Ctrl + J)
      if (e.ctrlKey && e.key === 'j') {
        e.preventDefault();
        if (selectedRange) {
          handleComment();
        }
      }

      // Bold shortcut (Ctrl + B)
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        if (selectedRange) {
          handleBold();
        }
      }

      // Underline shortcut (Ctrl + U)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        if (selectedRange) {
          handleUnderline();
        }
      }
    };

    document.addEventListener('keyup', handleKeyPress);
    return () => document.removeEventListener('keyup', handleKeyPress);
  }, [rendition, selectedRange]); // Add selectedRange to dependencies

  const handleSettingsChange = (newSettings) => {
    // Convert fontSize to number if it's coming as a string
    const fontSize = typeof newSettings.fontSize === 'string' 
      ? parseInt(newSettings.fontSize, 10)
      : newSettings.fontSize;

    setSettings({
      ...newSettings,
      fontSize: fontSize
    });
  };

  // Add these handler functions
  const handleHighlight = () => {
    if (!selectedRange) return;

    rendition.annotations.add(
      'highlight',
      selectedRange.cfiRange,
      {},
      null,
      'hl',
      {
        fill: '#ffeb3b',
        'fill-opacity': 0.3
      }
    );

    setHighlights(prev => [...prev, {
      cfiRange: selectedRange.cfiRange,
      color: '#ffeb3b',
      opacity: 0.3
    }]);

    setSelectionPopup({ show: false, x: 0, y: 0 });
    setSelectedRange(null);
  };

  const handleComment = () => {
    // Don't try to store and restore selection, just switch UI state
    setShowCommentInput(true);
    setSelectionPopup({ show: false, x: 0, y: 0 });
  };

  const closeCommentPopup = () => {
    if (selectedRange?.contents?.window) {
      selectedRange.contents.window.getSelection().removeAllRanges();
    }
    
    setShowCommentInput(false);
    setCommentText('');
    setSelectedRange(null);
    setSelectionPopup({ show: false, x: 0, y: 0 });
  };

  const handleSaveComment = () => {
    if (!selectedRange || !commentText.trim()) {
      closeCommentPopup();
      return;
    }

    const newComment = {
      id: Date.now(),
      cfiRange: selectedRange.cfiRange,
      text: commentText,
      content: selectedRange.text,
      timestamp: new Date().toISOString(),
      isNew: true
    };

    try {
      // First, close the comment input
      setShowCommentInput(false);
      setCommentText('');
      
      // Clear the selection
      if (selectedRange?.contents?.window) {
        selectedRange.contents.window.getSelection().removeAllRanges();
      }
      setSelectedRange(null);
      setSelectionPopup({ show: false, x: 0, y: 0 });

      // Then update comments and open sidebar
      setShowCommentsSidebar(true);
      
      // Add slight delay to ensure sidebar is open before comment slides in
      setTimeout(() => {
        const updatedComments = [...comments, newComment];
        setComments(updatedComments);
        localStorage.setItem('epub-comments', JSON.stringify(updatedComments));
      }, 300);

    } catch (error) {
      console.error('Error saving comment:', error);
    }
  };

  // Add this useEffect for loading comments
  useEffect(() => {
    if (rendition) {
      try {
        const savedComments = localStorage.getItem('epub-comments');
        if (savedComments) {
          const parsedComments = JSON.parse(savedComments);
          setComments(parsedComments);
          
          // Reapply comment markers
          parsedComments.forEach(comment => {
            rendition.annotations.add(
              'highlight',
              comment.cfiRange,
              { comment: comment.text },
              null,
              'comment',
              {
                'border-bottom': '2px dotted #ffd54f',
                'background-color': 'rgba(255, 213, 79, 0.2)'
              }
            );
          });
        }
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    }
  }, [rendition]);

  // Add this to your useEffect where you handle rendition initialization
  useEffect(() => {
    if (!rendition) return;

    rendition.hooks.content.register(contents => {
      contents.addStylesheetRules({
        'mark[data-epubjs-annotation="bold"]': {
          'font-weight': '700 !important',
          'background-color': 'transparent !important',
          'mix-blend-mode': 'normal'
        },
        'mark[data-epubjs-annotation="underline"]': {
          'text-decoration': 'underline !important',
          'text-decoration-thickness': '1px',
          'background-color': 'transparent !important',
          'mix-blend-mode': 'normal'
        }
      });
    });
  }, [rendition]);

  // Add this to save font settings
  useEffect(() => {
    if (settings) {
      try {
        localStorage.setItem('epub-settings', JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
  }, [settings]);

  // Load saved settings on init
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('epub-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // Add new handlers after handleComment
  const handleBold = () => {
    if (!selectedRange) return;

    rendition.annotations.add(
      'mark',
      selectedRange.cfiRange,
      {},
      null,
      'bold',
      {
        'font-weight': '700 !important',
        'background-color': 'transparent',
        'mix-blend-mode': 'normal'
      }
    );

    setSelectionPopup({ show: false, x: 0, y: 0 });
    setSelectedRange(null);
  };

  const handleUnderline = () => {
    if (!selectedRange) return;

    rendition.annotations.add(
      'mark',
      selectedRange.cfiRange,
      {},
      null,
      'underline',
      {
        'text-decoration': 'underline !important',
        'text-decoration-thickness': '1px',
        'background-color': 'transparent',
        'mix-blend-mode': 'normal'
      }
    );

    setSelectionPopup({ show: false, x: 0, y: 0 });
    setSelectedRange(null);
  };

  return (
    <div className="reader-container" style={{ backgroundColor: settings.bgColor }}>
      <div className="top-bar" style={{ 
        backgroundColor: settings.bgColor,
        color: getContrastColor(settings.bgColor)
      }}>
        <div className="left-controls">
          <button 
            className="button" 
            onClick={() => setShowCommentsSidebar(true)}
            style={{ color: getContrastColor(settings.bgColor) }}
          >
            <FiMenu />
          </button>
        </div>
        <div className="page-info" style={{ color: getContrastColor(settings.bgColor) }}>
          {isGeneratingLocations ? 
            'Calculating...' : 
            `${Math.round(currentLocation)}%`
          }
        </div>
        <button className="button" 
          onClick={() => setIsSettingsOpen(true)}
          style={{ color: getContrastColor(settings.bgColor) }}
        >
          <FiSettings />
        </button>
      </div>
      
      <div className="reader-content" style={{ backgroundColor: settings.bgColor }}>
        <div className="viewer-wrapper" style={{ backgroundColor: settings.bgColor }}>
          <div ref={viewerRef} className="viewer" />
        </div>
        
        <div className="navigation-buttons">
          <button 
            className="nav-button" 
            onClick={handlePrevPage}
            style={{ color: getContrastColor(settings.bgColor) }}
          >
            <FiChevronLeft />
          </button>
          <button 
            className="nav-button" 
            onClick={handleNextPage}
            style={{ color: getContrastColor(settings.bgColor) }}
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
      
      {showCommentsSidebar && (
        <div className="comments-sidebar">
          <div className="comments-header">
            <h3>Comments</h3>
            <button 
              className="close-button"
              onClick={() => setShowCommentsSidebar(false)}
            >
              <FiX />
            </button>
          </div>
          {comments.length === 0 ? (
            <p className="no-comments">No comments yet</p>
          ) : (
            <div className="comments-list">
              {comments.map(comment => (
                <div 
                  key={comment.id} 
                  className={`comment-item ${comment.isNew ? 'new-comment' : ''}`}
                  onAnimationEnd={() => {
                    // Remove the isNew flag after animation
                    if (comment.isNew) {
                      const updatedComments = comments.map(c => 
                        c.id === comment.id ? { ...c, isNew: false } : c
                      );
                      setComments(updatedComments);
                    }
                  }}
                >
                  <div className="comment-content">
                    <p className="selected-text">"{comment.content}"</p>
                    <p className="comment-text">{comment.text}</p>
                    <p className="comment-timestamp">
                      {new Date(comment.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    className="delete-comment"
                    onClick={() => {
                      const updatedComments = comments.filter(c => c.id !== comment.id);
                      setComments(updatedComments);
                      localStorage.setItem('epub-comments', JSON.stringify(updatedComments));
                    }}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      {selectionPopup.show && (
        <div
          className="selection-popup"
          style={{
            position: 'fixed',
            left: `${selectionPopup.x}px`,
            top: `${selectionPopup.y}px`,
            transform: 'translate(-100%, 0)'
          }}
        >
          <button 
            onClick={handleBold} 
            className="popup-button" 
            title="Bold (Ctrl + B)"
          >
            <FaBold />
          </button>
          <button 
            onClick={handleUnderline} 
            className="popup-button" 
            title="Underline (Ctrl + U)"
          >
            <FaUnderline />
          </button>
          <button 
            onClick={handleHighlight} 
            className="popup-button" 
            title="Highlight (Ctrl + H)"
          >
            <FaHighlighter />
          </button>
          <button 
            onClick={handleComment} 
            className="popup-button" 
            title="Comment (Ctrl + J)"
          >
            <FaComment />
          </button>
        </div>
      )}

      {showCommentInput && (
        <div
          className="comment-input-popup"
          style={{
            position: 'fixed',
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: 'translate(-50%, 0)',
            zIndex: 1000
          }}
        >
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Enter your comment..."
            autoFocus
          />
          <div className="comment-buttons">
            <button onClick={closeCommentPopup}>
              Cancel
            </button>
            <button onClick={handleSaveComment}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EpubReader; 