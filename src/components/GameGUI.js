import React from 'react';

const GameGUI = ({
  startPageLink,
  startPage,
  clickedLinks,
  linkMap,
  endPageLink,
  endPage,
  timer,
  clickCount,
  gameEnded,
  formatTime,
  resetGame,
  handleMouseEnter,
  handleMouseLeave,
}) => {
  return (
    <div className="gui-wrapper">
      <div className="game-gui">
        <div className="guiHeader">
          <h1>Blue Links</h1>
        </div>
        <p>
          Start Page:{' '}
          {startPageLink ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(e.target.getAttribute('data-href'));
              }}
              onMouseEnter={() => handleMouseEnter(startPage)}
              onMouseLeave={handleMouseLeave}
            >
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
        <p>
          End Page:{' '}
          {endPageLink ? (
            <a
              href={endPageLink}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => handleMouseEnter(endPage)}
              onMouseLeave={handleMouseLeave}
            >
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
      </div>
    </div>
  );
};

export default GameGUI;
