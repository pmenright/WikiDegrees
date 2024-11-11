import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import '../styles/Game.css';
import DOMPurify from 'dompurify/dist/purify.min';
import articleTitles from './article_titles.json';

axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => Math.min(Math.pow(2, retryCount) * 1000, 10000), // Exponential backoff with a maximum delay of 10 seconds
  retryCondition: (error) => {
    // Retry on network errors, 5xx status codes, rate limits, or connection aborted errors
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
  const [startPage, setStartPage] = useState(null);
  const [endPage, setEndPage] = useState(null);
  const [currentPageContent, setCurrentPageContent] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentPageTitle, setCurrentPageTitle] = useState('');
  const [clickedLinks, setClickedLinks] = useState([]);
  const [hoveredLink, setHoveredLink] = useState('');
  const [hoveredImage, setHoveredImage] = useState(null);
  const [hoveredDescription, setHoveredDescription] = useState('');
  const [showHoveredContent, setShowHoveredContent] = useState(false);
  const [activeRequests, setActiveRequests] = useState(0);
  const MAX_CONCURRENT_REQUESTS = 2;
  // const requestQueue = [];

  const resetRequestState = () => {
    setActiveRequests(0);
    // requestQueue = []; // Clear the queue  // Clears the queue
  };
  
  useEffect(() => {
    let timerInterval;
    if (!gameEnded) {
      timerInterval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [gameEnded]);

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

  useEffect(() => {
    initializeGame();
  }, []);

  const fetchRandomPage = async () => {
    const randomIndex = Math.floor(Math.random() * articleTitles.length);
    const title = articleTitles[randomIndex];

    try {
      const response = await axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      );
      if (response.status === 200) {
        return title;
      } else {
        throw new Error('Invalid page title');
      }
    } catch (error) {
      console.error('Error validating page title:', error);
      return fetchRandomPage();
    }
  };

  const initializeGame = async () => {
    let validPairFound = false;

    while (!validPairFound) {
      const start = await fetchRandomPage();
      let end = await fetchRandomPage();

      while (start === end) {
        end = await fetchRandomPage();
      }

      try {
        console.log('Checking for direct link from start to end');
        const response = await axios.get(
          `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(start)}`
        );
        const startPageContent = response.data;

        if (!startPageContent.includes(`/wiki/${encodeURIComponent(end)}`)) {
          validPairFound = true;
          setStartPage(start);
          setEndPage(end);
          fetchPageContent(start);
        } else {
          console.log('Direct link found, retrying with a new end page.');
        }
      } catch (error) {
        console.error('Error fetching page content for validation:', error);
      }
    }
  };

  const fetchPageContent = async (title) => {
    try {
      console.log('Fetching content for:', title);
      const encodedTitle = encodeURIComponent(title).replace(/[()]/g, (c) => `%${c.charCodeAt(0).toString(16)}`);
      const response = await axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/html/${encodedTitle}`
      );
      console.log('Content fetched for:', title);
      if (response.data) {
        setCurrentPageContent(response.data);
        setCurrentPageTitle(title);
        window.scrollTo(0, 0);
        fetchPageImageAndDescription(title);
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
      alert(`Failed to load page content for "${title}". Please try a different link.`);
    }
  };

  const fetchPageImageAndDescription = async (title) => {
    try {
      const response = await axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      );
      if (response.data) {
        if (response.data.thumbnail && response.data.thumbnail.source) {
          setHoveredImage(response.data.thumbnail.source);
        } else {
          setHoveredImage(null);
        }
        setHoveredDescription(response.data.description || '');
      }
    } catch (error) {
      console.error('Error fetching image and description:', error);
      setHoveredImage(null);
      setHoveredDescription('');
    }
  };

  // const processQueue = () => {
//   // Logic to process request queue can be implemented here if needed
// };

  const handleLinkClick = (linkElement) => {
    let linkHref = linkElement.getAttribute('href');
    console.log('Link href:', linkHref);

    if (!linkHref) {
      return;
    }

    if (linkHref.startsWith('./')) {
      linkHref = linkHref.replace('./', '/wiki/');
    } else if (linkHref.startsWith('../')) {
      linkHref = linkHref.replace('../', '/wiki/');
    } else if (!linkHref.startsWith('/')) {
      linkHref = '/wiki/' + linkHref;
    }

    if (!linkHref.startsWith('/wiki/')) {
      return;
    }

    if (linkHref.includes(':') || linkHref.includes('#') || linkHref.includes('?')) {
      return;
    }

    const pageTitle = decodeURIComponent(linkHref.replace('/wiki/', '')).replace(/_/g, ' ').toLowerCase();

    console.log('Navigating to page:', pageTitle);

    fetchPageContent(pageTitle)
      .then(() => {
        setClickCount((prevCount) => prevCount + 1);
        setClickedLinks((prevLinks) => [...prevLinks, pageTitle]);
      })
      .catch((error) => {
        console.error('Error loading page content:', error);
        if (window.confirm('Failed to load page. Would you like to retry?')) {
          handleLinkClick(linkElement);  // Retry the link click
        }
      });

    if (pageTitle === endPage.replace(/_/g, ' ').toLowerCase()) {
      setGameEnded(true);
    }
  };

  const handleMouseEnter = (title) => {
    setHoveredLink(title);
    setTimeout(() => {
      setShowHoveredContent(true);
    }, 500);
    fetchPageImageAndDescription(title);
  };

  const handleMouseLeave = () => {
    setHoveredLink('');
    setHoveredImage(null);
    setShowHoveredContent(false);
  };

  useEffect(() => {
    if (currentPageContent) {
      const container = document.querySelector('.article-container');
      if (container) {
        const links = container.querySelectorAll('a[href]');
        links.forEach((link) => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            handleLinkClick(link);
          });
          link.addEventListener('mouseenter', () => {
            let linkHref = link.getAttribute('href');
            if (linkHref.startsWith('./')) {
              linkHref = linkHref.replace('./', '/wiki/');
            } else if (linkHref.startsWith('../')) {
              linkHref = linkHref.replace('../', '/wiki/');
            } else if (!linkHref.startsWith('/')) {
              linkHref = '/wiki/' + linkHref;
            }
            const pageTitle = decodeURIComponent(linkHref.replace('/wiki/', '')).replace(/_/g, ' ');
            handleMouseEnter(pageTitle);
          });
          link.addEventListener('mouseleave', handleMouseLeave);
        });
      }
    }
  }, [currentPageContent]);

  const renderPageContent = () => {
    const sanitizedContent = DOMPurify.sanitize(currentPageContent, {
      RETURN_DOM: true,
      ADD_ATTR: ['href', 'title', 'data-*'],
      ADD_TAGS: ['a', 'span', 'b', 'i'],
      KEEP_CONTENT: true,
      FORBID_TAGS: ['script', 'style']
    });
  
    if (!sanitizedContent.querySelector('head')) {
      const headElement = document.createElement('head');
      sanitizedContent.insertBefore(headElement, sanitizedContent.firstChild);
    }
  
    const head = sanitizedContent.querySelector('head');
    if (head) {
      // Add multiple stylesheets for Wikipedia look and feel
      const stylesheets = [
        'https://en.wikipedia.org/w/load.php?modules=site.styles&only=styles&skin=vector',
        'https://en.wikipedia.org/w/load.php?modules=ext.cite.styles&only=styles',
        'https://en.wikipedia.org/w/load.php?modules=ext.purge&only=styles'
      ];
  
      stylesheets.forEach((href) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        head.appendChild(link);
      });
    } else {
      console.error('Failed to append Wikipedia stylesheets due to missing head element.');
    }
  
    sanitizedContent.querySelectorAll('a[href]').forEach((link) => {
      let linkHref = link.getAttribute('href');
      if (linkHref.startsWith('./')) {
        linkHref = linkHref.replace('./', '/wiki/');
      } else if (linkHref.startsWith('../')) {
        linkHref = linkHref.replace('../', '/wiki/');
      } else if (!linkHref.startsWith('/')) {
        linkHref = '/wiki/' + linkHref;
      }
      link.setAttribute('href', linkHref);
    });
  
    return (
      <div
        className="article-container"
        dangerouslySetInnerHTML={{ __html: sanitizedContent.outerHTML }}
      ></div>
    );
  };
  

  const resetGame = () => {
    setStartPage(null);
    setEndPage(null);
    setCurrentPageContent('');
    setClickCount(0);
    setTimer(0);
    setGameEnded(false);
    setCurrentPageTitle('');
    setClickedLinks([]);
    initializeGame();
  };

  const getWikipediaLink = (articleTitle) => {
    return `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`;
  };

  if (!startPage || !endPage) {
    return <div>Loading...</div>;
  }

  if (gameEnded) {
    return (
      <div className="congrats-screen">
        <h2>Congratulations!</h2>
        <p>You reached the end page.</p>
        <p>Time Taken: {formatTime(timer)}</p>
        <p>Number of Clicks: {clickCount}</p>
        <button onClick={resetGame}>Play Again</button>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="gui-wrapper">
        <div className="game-gui"> 
          <h1>Wiki Game</h1>
          <p>Start Page: <a href={getWikipediaLink(startPage)} target="_blank" rel="noopener noreferrer" onMouseEnter={() => handleMouseEnter(startPage)} onMouseLeave={handleMouseLeave}>{startPage}</a></p>
          <div className="click-history">
            <ul>
              {clickedLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={getWikipediaLink(link)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onMouseEnter={() => handleMouseEnter(link)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <p>End Page: <a href={getWikipediaLink(endPage)} target="_blank" rel="noopener noreferrer" onMouseEnter={() => handleMouseEnter(endPage)} onMouseLeave={handleMouseLeave}>{endPage}</a></p>
          <div className="timer-clicks">
            <p>Timer: {formatTime(timer)}</p>
            <p>Clicks: {clickCount}</p>
          </div>
          {showHoveredContent && (
            <div className="hovered-content">
              <h1>{hoveredLink}</h1>
              {hoveredImage && <img src={hoveredImage} alt="Hovered article thumbnail" />}
              {hoveredLink && <p>{hoveredLink}</p>}
            </div>
          )}
        </div>
      </div>
      <div className="content-area">
        <h1>{currentPageTitle}</h1>
        {renderPageContent()}
      </div>
    </div>
  );
}

export default Game;
