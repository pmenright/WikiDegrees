import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Game() {
  // State variables
  const [startPage, setStartPage] = useState(null);
  const [endPage, setEndPage] = useState(null);
  const [currentPageContent, setCurrentPageContent] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);

  // Timer logic
  useEffect(() => {
    let timerInterval;
    if (!gameEnded) {
      timerInterval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [gameEnded]);

  // Fetch start and end pages
  useEffect(() => {
    const fetchRandomPage = async () => {
      const response = await axios.get(
        'https://en.wikipedia.org/api/rest_v1/page/random/summary'
      );
      return response.data.title;
    };

    const initializeGame = async () => {
      const start = await fetchRandomPage();
      let end = await fetchRandomPage();

      // Ensure start and end pages are different
      while (start === end) {
        end = await fetchRandomPage();
      }

      setStartPage(start);
      setEndPage(end);
      fetchPageContent(start);
    };

    initializeGame();
  }, []);

  // Fetch page content
  const fetchPageContent = async (title) => {
    const response = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(
        title
      )}`
    );
    setCurrentPageContent(response.data);
  };

  // Handle link clicks
  const handleLinkClick = (e) => {
    e.preventDefault();
    const linkHref = e.target.getAttribute('href');

    // Extract the page title from the href
    const pageTitle = decodeURIComponent(linkHref.replace('/wiki/', ''));

    setClickCount((prevCount) => prevCount + 1);
    fetchPageContent(pageTitle);

    // Check for game end
    if (pageTitle === endPage) {
      setGameEnded(true);
    }
  };

  // Render page content with adjusted links
  const renderPageContent = () => {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: currentPageContent }}
        onClick={(e) => {
          if (e.target.tagName === 'A') {
            handleLinkClick(e);
          }
        }}
      ></div>
    );
  };

  if (!startPage || !endPage) {
    return <div>Loading...</div>;
  }

  if (gameEnded) {
    return (
      <div>
        <h2>Congratulations!</h2>
        <p>You reached the end page.</p>
        <p>Time Taken: {timer} seconds</p>
        <p>Number of Clicks: {clickCount}</p>
        <button onClick={() => window.location.reload()}>Play Again</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Wiki Game</h1>
      <p>Start Page: {startPage}</p>
      <p>End Page: {endPage}</p>
      <p>Timer: {timer} seconds</p>
      <p>Clicks: {clickCount}</p>
      <div>{renderPageContent()}</div>
    </div>
  );
}

export default Game;
