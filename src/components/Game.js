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
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [startPageLink, setStartPageLink] = useState('#');
const [endPageLink, setEndPageLink] = useState('#');
const [linkMap, setLinkMap] = useState({});


  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await initializeGame();
      setIsLoading(false);
    };
  
    init();
  }, []);  
  

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
    const fetchLink = async () => {
      if (startPage) {
        const link = await getWikipediaLink(startPage);
        setStartPageLink(link);
      }
    };
    fetchLink();
  }, [startPage]);
  
  useEffect(() => {
    const fetchLink = async () => {
      if (endPage) {
        const link = await getWikipediaLink(endPage);
        setEndPageLink(link);
      }
    };
    fetchLink();
  }, [endPage]);

  useEffect(() => {
    const fetchLinks = async () => {
      const newLinkMap = { ...linkMap };
      for (const link of clickedLinks) {
        if (!newLinkMap[link]) {
          newLinkMap[link] = await getWikipediaLink(link);
        }
      }
      setLinkMap(newLinkMap);
    };
    if (clickedLinks.length > 0) {
      fetchLinks();
    }
  }, [clickedLinks]);
  

  const fetchRandomPage = async () => {
    let validPage = false;
    let pageTitle = '';
  
    while (!validPage) {
      const randomIndex = Math.floor(Math.random() * articleTitles.length);
      const title = articleTitles[randomIndex];
  
      try {
        const response = await fetchPageSummary(title);
        if (response && response.title) {
          pageTitle = response.title;
          validPage = true;
        }
      } catch (error) {
        console.error('Error validating page title:', error);
      }
    }
  
    return pageTitle;
  };

  const initializeGame = async () => {
    setLoading(true);
    let validPairFound = false;
  
    while (!validPairFound) {
      const start = await fetchRandomPage();
      let end = await fetchRandomPage();
  
      while (start === end) {
        end = await fetchRandomPage();
      }
  
      try {
        const response = await axios.get(
          `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(start.replace('/wiki/', ''))}`
        );
        const startPageContent = response.data;
  
        if (!startPageContent.includes(`/wiki/${encodeURIComponent(end)}`)) {
          validPairFound = true;
          setStartPage(start);
          setEndPage(end);
          await fetchPageContent(`/wiki/${encodeURIComponent(start)}`);
        } else {
          console.log('Direct link found, retrying with a new end page.');
        }
      } catch (error) {
        console.error('Error fetching page content for validation:', error);
      }
    }
    setLoading(false);
  };
  
  

  const fetchPageContent = async (linkHref) => {
    window.scrollTo(0, 0);
  
    try {
      const title = decodeURIComponent(linkHref.replace('/wiki/', '').replace(/_/g, ' '));
      const response = await axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`
      );
  
      if (response.data) {
        setCurrentPageContent(response.data);
        setCurrentPageTitle(title);
        console.log(`Success: Loaded content for ${title}`);
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
      alert(`An unexpected error occurred while loading "${linkHref}".`);
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

const handleLinkClick = async (linkHref) => {
  if (!linkHref.startsWith('/wiki/')) {
    console.warn('Invalid link clicked:', linkHref);
    return;
  }

  // Extract the page title from the linkHref
  const pageTitle = decodeURIComponent(linkHref.replace('/wiki/', '').replace(/_/g, ' '));

  try {
    // Fetch the content of the new page
    const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(pageTitle)}`);
    
    if (response.data) {
      // Set the current page content and title if the fetch was successful
      setCurrentPageContent(response.data);
      setCurrentPageTitle(pageTitle);
      
      // Scroll to the top of the page
      window.scrollTo(0, 0);
      
      // Update click history and click count after successful load
      setClickedLinks((prevLinks) => [...prevLinks, pageTitle]);
      setClickCount((prevCount) => prevCount + 1);
    }
  } catch (error) {
    console.error('Error fetching page content for link:', error);
    alert(`Failed to load page content for "${pageTitle}".`);
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
            const linkHref = link.getAttribute('href');
            handleLinkClick(linkHref);
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

  const fetchPageSummary = async (title) => {
  try {
    const response = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    );
    if (response.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching page summary:", error);
  }
};

const getCanonicalURL = async (articleTitle) => {
  const summaryData = await fetchPageSummary(articleTitle);
  if (summaryData && summaryData.content_urls) {
    return summaryData.content_urls.desktop.page; // Use the canonical desktop URL
  }
  return null; // Handle cases where the page is not found
};

const getWikipediaLink = async (articleTitle) => {
  const url = await getCanonicalURL(articleTitle);
  if (url) {
    return url;
  }
  console.error('Failed to generate Wikipedia link for:', articleTitle);
  return '#'; // Fallback URL
};

if (loading) {
  return <div>Loading game, please wait...</div>;
}

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
            <p>Start Page: 
              {startPageLink ? (
                <a href={startPageLink} target="_blank" rel="noopener noreferrer" onMouseEnter={() => handleMouseEnter(startPage)} onMouseLeave={handleMouseLeave}>
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

            <p>End Page: 
              {endPageLink ? (
                <a href={endPageLink} target="_blank" rel="noopener noreferrer" onMouseEnter={() => handleMouseEnter(endPage)} onMouseLeave={handleMouseLeave}>
                  {endPage}
                </a>
              ) : (
                <span>Loading...</span>
              )}
            </p>
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
