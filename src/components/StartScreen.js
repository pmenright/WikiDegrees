import React from 'react';

import './StartScreen.css';

const StartScreen = ({ startPageLink, endPageLink, startGame, isLoading, generateNewStartPage, generateNewEndPage }) => {
  return (
    <div className="start-screen">
      <h1>Blue Links</h1>
      {isLoading ? (
        <p>Loading random pages, please wait...</p>
      ) : (
        <>
          <p>Try to connect these two articles:</p>
          <div className="article-links">
            <div className="article-title-container fixed-width">
              <div className="article-link">
                <a href={startPageLink} target="_blank" rel="noopener noreferrer">
                  {startPageLink.replace('/wiki/', '').replace(/_/g, ' ')}
                </a>
              </div>
            </div>
            <div className="article-title-container fixed-width">
              <div className="article-link">
                <a href={endPageLink} target="_blank" rel="noopener noreferrer">
                  {endPageLink.replace('/wiki/', '').replace(/_/g, ' ')}
                </a>
              </div>
            </div>
          </div>
          <div className="generate-buttons">
            <button onClick={generateNewStartPage}>Generate New Start Page</button>
            <button onClick={generateNewEndPage}>Generate New End Page</button>
          </div>
          <button 
            className="start-game-button" 
            onClick={() => { 
              console.log('Start Game clicked'); 
              startGame(); 
            }}
          >
            Start Game
          </button>
        </>
      )}
    </div>
  );
};

export default StartScreen;
