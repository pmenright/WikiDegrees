import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/Game.css';
import DOMPurify from 'dompurify/dist/purify.min';
import articleTitles from './article_titles.json';

function Game() {
  const [startPage, setStartPage] = useState(null);
  const [endPage, setEndPage] = useState(null);
  const [currentPageContent, setCurrentPageContent] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentPageTitle, setCurrentPageTitle] = useState('');
  const [clickedLinks, setClickedLinks] = useState([]);
  const MAX_CONCURRENT_REQUESTS = 2;
  const requestQueue = [];
  let activeRequests = 0;

  const resetRequestState = () => {
    activeRequests = 0;
    requestQueue.length = 0;  // Clears the queue
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

  const fetchRandomPage = () => {
    const randomIndex = Math.floor(Math.random() * articleTitles.length);
    return articleTitles[randomIndex];
  };

  const initializeGame = async () => {
    let validPairFound = false;

    while (!validPairFound) {
      const start = fetchRandomPage();
      let end = fetchRandomPage();

      while (start === end) {
        end = fetchRandomPage();
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

  const fetchPageContent = useCallback(
    (title, retryCount = 0) => {
      return new Promise((resolve, reject) => {
        requestQueue.push(() => fetchPageContentInternal(title, retryCount, resolve, reject));
        processQueue();
      });
    },


    (title, retryCount = 0) => {
      requestQueue.push(() => fetchPageContentInternal(title, retryCount));
      processQueue();
    },
    []
  );

  const fetchPageContentInternal = async (title, retryCount, resolve, reject) => {
    if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
      resolve();
      return;
    }

    activeRequests++;

    try {
      console.log('Fetching content for:', title);
      const encodedTitle = encodeURIComponent(title).replace(/[()]/g, (c) => `%${c.charCodeAt(0).toString(16)}`);
      const response = await axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/html/${encodedTitle}`
      );
      console.log('Content fetched for:', title);
      resolve();
      setCurrentPageContent(response.data);
      setCurrentPageTitle(title);
      window.scrollTo(0, 0);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        if (retryCount < 3) {
          console.warn(`Page not found for "${title}". Retrying (${retryCount + 1}/3).`);
          setTimeout(() => fetchPageContent(title, retryCount + 1), 1000);
        } else {
          console.error(`Failed to load page content for "${title}" after multiple attempts.`);
          alert(`Failed to load page content for "${title}" after multiple attempts. Please try a different link.`);
          resolve();
        }
      } else {
        console.error('Error fetching page content:', error);
        alert(`Failed to load page content for "${title}". Please try a different link.`);
        reject();
      }
    } finally {
      activeRequests--;
      processQueue();
    }
  };

  const processQueue = () => {
    while (activeRequests < MAX_CONCURRENT_REQUESTS && requestQueue.length > 0) {
      const nextRequest = requestQueue.shift();
      nextRequest();
    }
  };

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
        resetRequestState();
        if (window.confirm('Failed to load page. Would you like to retry?')) {
          handleLinkClick(linkElement);  // Retry the link click
        }
      });

    if (pageTitle === endPage.replace(/_/g, ' ').toLowerCase()) {
      setGameEnded(true);
    }
  };

  const handleContentClick = (e) => {
    let target = e.target;
    while (target && target !== e.currentTarget) {
      if (target.tagName === 'A') {
        e.preventDefault();
        handleLinkClick(target);
        break;
      }
      target = target.parentNode;
    }
  };

  const renderPageContent = () => {
    const sanitizedContent = DOMPurify.sanitize(currentPageContent, { RETURN_DOM: true });

    if (!sanitizedContent.querySelector('head')) {
      const headElement = document.createElement('head');
      sanitizedContent.insertBefore(headElement, sanitizedContent.firstChild);
    }

    const head = sanitizedContent.querySelector('head');
    if (head) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://en.wikipedia.org/w/load.php?modules=site.styles&only=styles&skin=vector';
      head.appendChild(link);
    } else {
      console.error('Failed to append Wikipedia stylesheet due to missing head element.');
    }

    sanitizedContent.querySelectorAll('a[href^="/wiki/"]').forEach((link) => {
      const pageTitle = decodeURIComponent(link.getAttribute('href').replace('/wiki/', '')).replace(/_/g, ' ');
      
          });

    return (
      <div
        className="article-container"
        dangerouslySetInnerHTML={{ __html: sanitizedContent.outerHTML }}
        onClick={handleContentClick}
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
      <div className="game-gui"> 
        <h1>Wiki Game</h1>
        <p>Start Page: <a href={getWikipediaLink(startPage)} target="_blank" rel="noopener noreferrer">{startPage}</a></p>
        <div className="click-history">
          <ul>
            {clickedLinks.map((link, index) => (
              <li key={index}><a href={getWikipediaLink(link)} target="_blank" rel="noopener noreferrer">{link}</a></li>
            ))}
          </ul>
        </div>
        <p>End Page: <a href={getWikipediaLink(endPage)} target="_blank" rel="noopener noreferrer">{endPage}</a></p>
        <div className="timer-clicks">
          <p>Timer: {formatTime(timer)}</p>
          <p>Clicks: {clickCount}</p>
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
