import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import '../styles/Game.css';
import DOMPurify from 'dompurify/dist/purify.min';
import articleTitles from './article_titles.json';
import StartScreen from './StartScreen';

axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => Math.min(Math.pow(2, retryCount) * 1000, 10000), // Exponential backoff with a maximum delay of 10 seconds
  retryCondition: (error) => {
    const isLocalhost = window.location.hostname === 'localhost';
    return (
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600) ||
      error.response.status === 429 ||
      (isLocalhost && error.response.status === 404) ||
      error.code === 'ECONNABORTED'
    );
  }
});

function Game() {
  // State variables for StartScreen
  const [isLoading, setIsLoading] = useState(false);
  const generateNewStartPage = async () => {
    console.log('Generating a new start page...');
    setIsLoading(true);
    const newStart = await fetchRandomPage();
    setStartPage(newStart);
    setStartPageLink(`/wiki/${newStart}`);
    setIsLoading(false);
  };
  const generateNewEndPage = async () => {
    console.log('Generating a new end page...');
    setIsLoading(true);
    const newEnd = await fetchRandomPage();
    setEndPage(newEnd);
    setEndPageLink(`/wiki/${newEnd}`);
    setIsLoading(false);
  };
  const [startPage, setStartPage] = useState(null);
  const [endPage, setEndPage] = useState(null);
  const [currentPageContent, setCurrentPageContent] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentPageTitle, setCurrentPageTitle] = useState('');
  const [clickedLinks, setClickedLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startPageLink, setStartPageLink] = useState('#');
  const [endPageLink, setEndPageLink] = useState('#');
  const [showStartPage, setShowStartPage] = useState(true);
  const [linkMap, setLinkMap] = useState({});
  const [showHoveredContent, setShowHoveredContent] = useState(false);
  const [hoveredLink, setHoveredLink] = useState('');
  const [hoveredImage, setHoveredImage] = useState(null);
  const [hoveredDescription, setHoveredDescription] = useState('');

  useEffect(() => {
    const init = async () => {
      await initializeGame();
    };

    init();
  }, []);

  useEffect(() => {
    let timerInterval;
    if (!gameEnded && !showStartPage && !loading) {
      timerInterval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [gameEnded, showStartPage, loading]);

  useEffect(() => {
    const contentContainer = document.getElementById('content-container');
    
    if (contentContainer) {
      const handleMouseEnterDelegated = (e) => {
        if (e.target.tagName === 'A' && e.target.getAttribute('href')) {
          const linkHref = e.target.getAttribute('href');
          if (linkHref.startsWith('/wiki/')) {
            handleMouseEnter(decodeURIComponent(linkHref.replace('/wiki/', '').replace(/_/g, ' ')));
          }
        }
      };
  
      const handleMouseLeaveDelegated = (e) => {
        if (e.target.tagName === 'A' && e.target.getAttribute('href')) {
          handleMouseLeave();
        }
      };
  
      contentContainer.addEventListener('mouseenter', handleMouseEnterDelegated, true);
      contentContainer.addEventListener('mouseleave', handleMouseLeaveDelegated, true);
  
      return () => {
        contentContainer.removeEventListener('mouseenter', handleMouseEnterDelegated, true);
        contentContainer.removeEventListener('mouseleave', handleMouseLeaveDelegated, true);
      };
    }
  }, [currentPageContent]);

  useEffect(() => {
    const contentContainer = document.getElementById('content-container');
  
    if (contentContainer) {
      const handleClickDelegated = (e) => {
        if (e.target.tagName === 'A' && e.target.getAttribute('href')) {
          const linkHref = e.target.getAttribute('href');
          if (linkHref.startsWith('/wiki/')) {
            e.preventDefault();
            e.stopPropagation();
            handleLinkClick(linkHref);
          }
        }
      };
  
      contentContainer.addEventListener('click', handleClickDelegated, true);
  
      return () => {
        contentContainer.removeEventListener('click', handleClickDelegated, true);
      };
    }
  }, [currentPageContent]);

  useEffect(() => {
    const links = document.querySelectorAll('.content-area a');

    links.forEach(link => {
      const lineHeight = parseFloat(getComputedStyle(link).lineHeight);
      const clientHeight = link.clientHeight;

      // Check if the link spans multiple lines
      if (clientHeight > lineHeight) {
        const words = link.innerText.split(' ');

        // Clear original link content
        link.innerHTML = '';

        // Wrap each word in a span
        words.forEach((word, index) => {
          const wordSpan = document.createElement('span');
          wordSpan.classList.add('word-span');
          wordSpan.innerText = word;

          // Append space after the word unless it's the last one
          if (index < words.length - 1) {
            wordSpan.innerText += ' ';
          }

          link.appendChild(wordSpan);
        });
      }
    });
  }, [currentPageContent]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

    if (hours > 0) {
      return `${hours}:${formattedMinutes}:${formattedSeconds}`;
    } else {
      return `${minutes}:${formattedSeconds}`;
    }
  };

  const fetchRandomPage = async () => {
    const randomIndex = Math.floor(Math.random() * articleTitles.length);
    return articleTitles[randomIndex];
  };

  const initializeGame = async () => {
    console.log('Initializing game with start and end pages');
    setLoading(true);
    let start = await fetchRandomPage();
    let end = await fetchRandomPage();

    while (start === end) {
      end = await fetchRandomPage();
    }

    setStartPage(start);
    setEndPage(end);
    setStartPageLink(`/wiki/${start}`);
    setEndPageLink(`/wiki/${end}`);
    setLoading(false);
  };

  const startGame = async () => {
    console.log('Starting game with start page:', startPage);
    if (showStartPage) {
      setShowStartPage(false);
      setLoading(true);
      await fetchPageContent(`/wiki/${encodeURIComponent(startPage)}`);
      setLoading(false);
    }
  };
  
  const fetchPageContent = async (linkHref) => {
    console.log('Fetching content for:', linkHref);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    try {
      const title = decodeURIComponent(linkHref.replace('/wiki/', '').replace(/_/g, ' '));
      const response = await axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`
      );

      if (response.data) {
        const sanitizedContent = DOMPurify.sanitize(response.data);
        setCurrentPageContent(sanitizedContent);
        setCurrentPageTitle(title);
        console.log(`Success: Loaded content for ${title}`);
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
      alert(`An unexpected error occurred while loading "${linkHref}".`);
    }
  };

  const handleLinkClick = async (linkHref) => {
    console.log('Link clicked:', linkHref);
    if (!linkHref.startsWith('/wiki/')) {
      console.warn('Invalid link clicked:', linkHref);
      return;
    }
  
    setLoading(true);
    const pageTitle = decodeURIComponent(linkHref.replace('/wiki/', '').replace(/_/g, ' '));
  
    try {
      const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(pageTitle)}`);
      
      if (response.data) {
        const sanitizedContent = DOMPurify.sanitize(response.data);
        setCurrentPageContent(sanitizedContent);
        setCurrentPageTitle(pageTitle);
  
        // Update clicked links and click count without triggering game reset
        setClickedLinks((prevLinks) => [...prevLinks, pageTitle]);
        setClickCount((prevCount) => prevCount + 1);
  
        // Update linkMap with the valid URL
        setLinkMap((prevMap) => ({
          ...prevMap,
          [pageTitle]: linkHref
        }));
  
        // Check if the current page matches the end page
        if (pageTitle === endPage) {
          setGameEnded(true);
        }
      }
    } catch (error) {
      console.error('Error fetching page content for link:', error);
      alert(`Failed to load page content for "${pageTitle}".`);
    }
    setLoading(false);
  };
  
  const handleMouseEnter = async (link) => {
    setShowHoveredContent(true);
    setHoveredLink(link);
  
    try {
      const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(link)}`);
      
      if (response.data) {
        setHoveredImage(response.data.thumbnail?.source || null);
        setHoveredDescription(response.data.extract || '');
      }
    } catch (error) {
      console.error('Error fetching hover content:', error);
      setHoveredImage(null);
      setHoveredDescription('No description available.');
    }
  };
  

  const handleMouseLeave = () => {
    setShowHoveredContent(false);
    setHoveredLink('');
    setHoveredImage(null);
    setHoveredDescription('');
  };

  const resetGame = () => {
    console.log('Resetting game');
    setGameEnded(false);
    setClickCount(0);
    setTimer(0);
    setClickedLinks([]);
    setShowStartPage(true); // Only switch to start page during reset
    initializeGame();
  };

  const renderPageContent = () => {
    console.log('Rendering page content for:', currentPageTitle);
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentPageContent, 'text/html');
  
    // Locate and remove specific sections
    const sectionsToRemove = ['references', 'citations', 'cited_sources', 'further_reading', 'notes', 'external_links'];
    sectionsToRemove.forEach((sectionId) => {
      const sectionHeader = doc.querySelector(`h1#${sectionId}, h2#${sectionId}, h3#${sectionId}`);
      if (sectionHeader) {
        const section = sectionHeader.closest('section');
        if (section) {
          section.remove();
        }
      }
    });
  
    // Modify links to ensure proper handling in React
    doc.querySelectorAll('a[href]').forEach((link) => {
      let linkHref = link.getAttribute('href');
  
      if (linkHref.startsWith('./') || linkHref.startsWith('../')) {
        // Convert relative paths to absolute paths starting with /wiki/
        linkHref = linkHref.replace('./', '/wiki/').replace('../', '/wiki/');
      }
  
      // Filter out non-article links, citation links (#cite), image links (File:), or any external links
      if (!linkHref.startsWith('/wiki/') || linkHref.includes('#cite') || linkHref.includes('File:') || linkHref.includes(':')) {
        // Remove href attribute and disable link behavior for non-article links
        link.removeAttribute('href');
        link.classList.add('non-clickable-link');
        link.style.pointerEvents = 'none';
        link.style.textDecoration = 'none';        
        link.style.color = 'inherit'; // Make the link color match body text
        return;
      }
  
      link.setAttribute('href', linkHref); // Ensure the href is properly formatted
  
      // Add an event listener to handle link clicks
      link.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent full page reload
        e.stopPropagation(); // Stop event from bubbling to other handlers
        handleLinkClick(linkHref); // Use our custom link handler
      });
    });
  
    return (
      <div
        id="content-container"
        className="content-container"
        dangerouslySetInnerHTML={{ __html: doc.documentElement.innerHTML }}
      />
    );
  };

  return (
    <div className="game-container">
      { loading ? (
        <div className="loading-message">
          <h2>Loading...</h2>
        </div>
      ) : showStartPage ? (
        <StartScreen
          startPageLink={startPageLink}
          endPageLink={endPageLink}
          startGame={startGame}
          isLoading={isLoading}
          generateNewStartPage={generateNewStartPage}
          generateNewEndPage={generateNewEndPage}
        />
      ) : (
        <div className="game-container">
          <div className="gui-wrapper">
            <div className="game-gui">
              <div className="guiHeader">
                <h1>Blue Links</h1>
              </div>
              <p>Start Page: {startPageLink ? (
                  <a href="#" onClick={(e) => { e.preventDefault(); console.log('Link intercepted:', e.target.getAttribute('data-href')); handleLinkClick(e.target.getAttribute('data-href')); }} onMouseEnter={() => handleMouseEnter(startPage)} onMouseLeave={handleMouseLeave}>
                    {startPage}
                  </a>
                ) : (
                  <span>Loading...</span>
                )}
              </p>
              <div className="click-history">
                <ul>
                  {clickedLinks.map((link, index) => (
                    <li key={index}>
                      {linkMap[link] ? (
                        <a
                          href={linkMap[link]}
                          target="_blank"
                          rel="noopener noreferrer"
                          onMouseEnter={() => handleMouseEnter(link)}
                          onMouseLeave={handleMouseLeave}
                        >
                          {link}
                        </a>
                      ) : (
                        <span>{link} (Loading...)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <p>End Page: {endPageLink ? (
                  <a href={endPageLink} target="_blank" rel="noopener noreferrer" onMouseEnter={() => handleMouseEnter(endPage)} onMouseLeave={handleMouseLeave}>
                    {endPage}
                  </a>
                ) : (
                  <span>Loading...</span>
                )}
              </p>
              <div className="timer-clicks-wrapper">
                <div className="timer">
                  <p>Timer: {formatTime(timer)}</p>
                </div>
                <div className="click-counter">
                  <p>Clicks: {clickCount}</p>
                </div>
              </div>
              {gameEnded && (
                <div className="win-message">
                  <h2>Congratulations!</h2>
                  <p>You reached the end page.</p>
                  <p>Time Taken: {formatTime(timer)}</p>
                  <p>Number of Clicks: {clickCount}</p>
                  <button onClick={resetGame}>Play Again</button>
                </div>
              )}
              {showHoveredContent && (
                <div className="hovered-content">
                  <h1>{hoveredLink}</h1>
                  {hoveredImage && <img src={hoveredImage} alt="Hovered article thumbnail" />}
                  {hoveredLink && <p>{hoveredDescription}</p>}
                </div>
              )}
            </div>
          </div>
          <div className="content-area">
            <div className="content-header">
              <h1>{currentPageTitle}</h1>
            </div>
            <div className="content-scrollable">
              {renderPageContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;
