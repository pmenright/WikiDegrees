import React, { useState, useEffect } from 'react';
import articleTitles from './article_titles.json';
import './StartScreen.css';
import BlueLinksLogo from '../img/BlueLinks.svg';

const getRandomTitle = () => {
  const randomIndex = Math.floor(Math.random() * articleTitles.length);
  return articleTitles[randomIndex];
};

const fetchArticleDataDirectly = async (articleTitle) => {
  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch article data');
    }
    const data = await response.json();
    console.log('Fetched Article Data:', data);
    const imageUrl = `${data.thumbnail?.source || data.originalimage?.source || 'https://via.placeholder.com/300x150'}?timestamp=${new Date().getTime()}`;
    console.log('Selected Image URL:', imageUrl);
    const articleLink = `/wiki/${encodeURIComponent(data.title || 'Untitled').replace(/%20/g, '_')}`;
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(data.title)}`;
    return {
      title: data.title || 'Untitled',
      image: imageUrl,
      description: data.extract || 'No description available.',
      link: articleLink,
      apiUrl: apiUrl,
    };
  } catch (error) {
    console.error('Error fetching article data:', error);
    return {
      title: 'Untitled',
      image: 'https://via.placeholder.com/300x150',
      description: 'Error fetching description.',
      link: '',
      apiUrl: '',
    };
  }
};

const StartScreen = ({ startArticle, setStartArticle, endArticle, setEndArticle, onGameStart }) => {
  const [startArticleTitle, setStartArticleTitle] = useState('Loading...');
  const [endArticleTitle, setEndArticleTitle] = useState('Loading...');
  const [startArticleImage, setStartArticleImage] = useState('https://via.placeholder.com/300x150');
  const [endArticleImage, setEndArticleImage] = useState('https://via.placeholder.com/300x150');
  const [startArticleBlurb, setStartArticleBlurb] = useState('Loading...');
  const [endArticleBlurb, setEndArticleBlurb] = useState('Loading...');

  const handleNewStartArticle = async () => {
    try {
      const articleTitle = getRandomTitle();
      const articleData = await fetchArticleDataDirectly(articleTitle);
      setStartArticleTitle(articleData.title);
      setStartArticleImage(articleData.image);
      console.log('Updated Start Article Image:', articleData.image);
      setStartArticleBlurb(articleData.description);
      setStartArticle(articleData); // Save the entire article data
    } catch (error) {
      console.error('Error handling new start article:', error);
    }
  };
  
  const handleNewEndArticle = async () => {
    try {
      const articleTitle = getRandomTitle();
      const articleData = await fetchArticleDataDirectly(articleTitle);
      setEndArticleTitle(articleData.title);
      setEndArticleImage(articleData.image);
      console.log('Updated End Article Image:', articleData.image);
      setEndArticleBlurb(articleData.description);
      setEndArticle(articleData); // Save the entire article data
    } catch (error) {
      console.error('Error handling new end article:', error);
    }
  };
  

  useEffect(() => {
    handleNewStartArticle();
    handleNewEndArticle();
  }, []);


  const handleStartGame = () => {
    console.log('Start Game clicked');
    if (onGameStart) {
      onGameStart(startArticle, endArticle); // Pass as two arguments
    } else {
      console.error('onGameStart is not a function');
    }
  };  
   

  return (
    <div className="start-screen">
      <img
        src={BlueLinksLogo}
        alt="Blue Links Logo"
        style={{
          width: '210px',
          position: 'absolute',
          top: '20px',
          left: '20px',
        }}
      />
      <div className="articles-container" style={{ gap: '100px' }}>
        {/* Start Article Card */}
        <div className="label-article-container">
          <h2 className="article-label">Starting Article:</h2>
          <div className="article-card">
            <div className="card">
              <h3 className="article-title">{startArticleTitle}</h3>
              <div className="scrollable-content">
                <img
                  className="article-image"
                  src={startArticleImage}
                  alt="Starting Article"
                  key={startArticleImage}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x150';
                  }}
                />
                <p className="article-blurb">{startArticleBlurb}</p>
              </div>
              <button className="new-article-button" onClick={handleNewStartArticle}>
                New Article
              </button>
            </div>
          </div>
        </div>
        {/* End Article Card */}
        <div className="label-article-container">
          <h2 className="article-label">Ending Article:</h2>
          <div className="article-card">
            <div className="card">
              <h3 className="article-title">{endArticleTitle}</h3>
              <div className="scrollable-content">
                <img
                  className="article-image"
                  src={endArticleImage}
                  alt="Ending Article"
                  key={endArticleImage}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x150';
                  }}
                />
                <p className="article-blurb">{endArticleBlurb}</p>
              </div>
              <button className="new-article-button" onClick={handleNewEndArticle}>
                New Article
              </button>
            </div>
          </div>
        </div>
      </div>
      <button
        className="start-game-button"
        onClick={handleStartGame}
      >
        Start Game
      </button>
    </div>
  );
};

export default StartScreen;
