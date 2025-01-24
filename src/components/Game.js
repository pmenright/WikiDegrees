import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import '../styles/Game.css';
import DOMPurify from 'dompurify/dist/purify.min';
import StartScreen from './StartScreen';
import Tooltip from './Tooltip';
import BlueLinksLogo from '../img/BlueLinks.svg';


axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => Math.min(Math.pow(2, retryCount) * 1000, 10000),
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

const Game = () => {
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [startArticle, setStartArticle] = useState(null);
  const [endArticle, setEndArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPageContent, setCurrentPageContent] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentPageTitle, setCurrentPageTitle] = useState('');
  const [clickedLinks, setClickedLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startPageLink, setStartPageLink] = useState('#');
  const [endPageLink, setEndPageLink] = useState('#');
  const [linkMap, setLinkMap] = useState({});
  const [showHoveredContent, setShowHoveredContent] = useState(false);  const [hoveredLink, setHoveredLink] = useState(null);
  const [hoveredImage, setHoveredImage] = useState(null);
  const [hoveredDescription, setHoveredDescription] = useState('');  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const progressionContainerRef = useRef(null);

  // State variables for StartScreen
  const generateNewStartPage = async () => {
    console.log('Generating a new start page...');
    setIsLoading(true);
    setIsLoading(false);
  };
  const generateNewEndPage = async () => {
    console.log('Generating a new end page...');
    setIsLoading(true);
    // const newEnd = await fetchRandomPage();
    // setEndPage(newEnd);
    // setEndPageLink(`/wiki/${newEnd}`);
    setIsLoading(false);
  };


    const links = document.querySelectorAll(".content-area a"); // Target links


    const positionTooltip = (event) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
  
    let left = event.pageX + 10; // Offset from the cursor
    let top = event.pageY + 10; // Offset from the cursor
  
    // Ensure the tooltip stays within the viewport
    if (left + 300 > viewportWidth) { // Assuming tooltip width ~300px
      left = viewportWidth - 310;
    }
    if (top + 100 > viewportHeight) { // Assuming tooltip height ~100px
      top = viewportHeight - 110;
    }
  
    setTooltipPosition({ x: left, y: top });
    };


    links.forEach((link) => {
      link.addEventListener("mouseenter", (event) => {
        // Store the title attribute to restore later
        const originalTitle = link.getAttribute("title");
        link.setAttribute("data-original-title", originalTitle);
        link.removeAttribute("title"); // Remove the title attribute to suppress the tooltip

        setShowHoveredContent(true);
        positionTooltip(event);
      });

      link.addEventListener("mousemove", (event) => {
        positionTooltip(event);
      });

      link.addEventListener("mouseleave", () => {
        // Restore the title attribute
        const originalTitle = link.getAttribute("data-original-title");
        if (originalTitle) {
          link.setAttribute("title", originalTitle);
        }
        link.removeAttribute("data-original-title");

        setShowHoveredContent(false);
      });
    
      link.addEventListener("mousemove", (event) => {
        positionTooltip(event);
      });
      
      link.addEventListener("mouseleave", () => {
        setShowHoveredContent(false);
      });
    });

    useEffect(() => {
      let timerInterval;
      if (!gameEnded && !showStartScreen && !loading) {
        timerInterval = setInterval(() => {
          setTimer((prevTimer) => prevTimer + 1);
        }, 1000);
      }
      return () => clearInterval(timerInterval);
    }, [gameEnded, showStartScreen, loading]);
    
    
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
            if (linkHref && linkHref.startsWith('/wiki/')) {
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
      console.log('Tooltip State:', {
        showHoveredContent,
        hoveredLink,
        tooltipPosition,
        hoveredImage,
        hoveredDescription,
      });
    }, [showHoveredContent, hoveredLink, tooltipPosition, hoveredImage, hoveredDescription]);
    
    useEffect(() => {
      if (currentPageContent) {
        console.log('Rendering page content for:', currentPageTitle);
      }
    }, [currentPageContent]); // Only re-run if `currentPageContent` changes
    
    useEffect(() => {
      const handleScroll = () => {
        setShowHoveredContent(false); // Hide tooltip on scroll
        setHoveredLink(null);
        setHoveredImage(null);
        setHoveredDescription('');
      };
    
      window.addEventListener('scroll', handleScroll);
    
      return () => {
        window.removeEventListener('scroll', handleScroll); // Cleanup listener on component unmount
      };
    }, []);

    useEffect(() => {
      return () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }
      };
    }, [hoverTimeout]);    
    
    useEffect(() => {
      if (startArticle) {
        setHoveredLink(startArticle.title); // Initialize tooltip content
        setHoveredDescription(startArticle.description || "No description available.");
        setHoveredImage(startArticle.image || null);
      }
    }, [startArticle]);

    useEffect(() => {
      if (progressionContainerRef.current) {
        const container = progressionContainerRef.current;
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, [clickedLinks]);
    
    
    

    const loadWikipediaCSS = async () => {
      const styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = 'https://en.wikipedia.org/w/load.php?lang=en&modules=site.styles&only=styles&skin=vector';
      document.head.appendChild(styleLink);
    };
  
    loadWikipediaCSS();  

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

    const fetchPageContent = async (linkHref) => {
      setLoading(true); // Start loading
      console.log('Fetching content for:', linkHref);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    
      try {
        const title = decodeURIComponent(linkHref.replace('/wiki/', '').replace(/_/g, ' '));
        console.log('Decoded title:', title);
        const response = await axios.get(
          `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`
        );
    
        if (response.data) {
          const sanitizedContent = DOMPurify.sanitize(response.data);
          console.log('Sanitized content:', sanitizedContent);
          setCurrentPageContent(sanitizedContent);
          setCurrentPageTitle(title);
          console.log(`Success: Loaded content for ${title}`);
    
          // Preload tooltip data for the starting article
          if (!hoveredLink) {
            await fetchTooltipData(title);
            setShowHoveredContent(false); // Ensure the tooltip is hidden initially
          }
        }
      } catch (error) {
        console.error('Error fetching page content:', error);
        alert(`An unexpected error occurred while loading "${linkHref}".`);
      } finally {
        setLoading(false); // End loading
      }
    };
    
    
    

    const handleLinkClick = async (linkHref) => {
      if (!linkHref) {
        console.warn('Attempted to handle link click for a null or undefined linkHref');
        return;
      }
    
      console.log('Link clicked:', linkHref);
      if (!linkHref.startsWith('/wiki/')) {
        console.warn('Invalid link clicked:', linkHref);
        return;
      }
    
      // Reset tooltip state to hide it
      setShowHoveredContent(false);
      setHoveredLink('');
      setHoveredDescription('');
      setHoveredImage(null);
    
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
            [pageTitle]: linkHref,
          }));
    
          // Check if the current page matches the end page
          if (pageTitle === endArticle) {
            setGameEnded(true);
          }
        }
      } catch (error) {
        console.error('Error fetching page content for link:', error);
        alert(`Failed to load page content for "${pageTitle}".`);
      }
      setLoading(false);
    };
    


// const handleMouseEnter = async (link) => {
//   if (hoveredLink === link) return; // Avoid redundant state updates

//   setHoveredLink(null); // Temporarily clear the tooltip content
//   setShowHoveredContent(false); // Ensure the tooltip is hidden initially

//   try {
//     // Fetch the data for the hovered link
//     const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(link)}`);

//     if (response.data) {
//       const { title, extract: description, thumbnail } = response.data;
//       const imageUrl = thumbnail?.source || null;

//       // Update the state with fully loaded data
//       setHoveredLink(title);
//       setHoveredDescription(description || "No description available.");
//       setHoveredImage(imageUrl);

//       setShowHoveredContent(true); // Show the tooltip only when all data is ready
//     }
//   } catch (error) {
//     console.error("Error fetching tooltip data:", error);
//     // Optionally handle errors by logging or showing default content
//   }
// };

const handleMouseEnter = (link) => {
  if (hoveredLink === link) return; // Avoid redundant state updates

  // Clear any existing hover timeout
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
  }

  // Preload tooltip content but don't display immediately
  setShowHoveredContent(false); // Ensure the tooltip is hidden initially

  const timeout = setTimeout(async () => {
    setIsHovering(true); // Mark the mouse as hovering
    await fetchTooltipData(link); // Fetch and update tooltip data
    if (isHovering) {
      setShowHoveredContent(true); // Show the tooltip after data loads
    }
  }, 500); // Add a delay for smoother behavior

  setHoverTimeout(timeout); // Save the timeout reference
};


const handleMouseLeave = () => {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
  }

  setIsHovering(false);
  setHoverTimeout(null);

  setShowHoveredContent(false); // Hide the tooltip
  setHoveredLink(null);
  setHoveredDescription('');
  setHoveredImage(null);
};


const fetchTooltipData = async (articleTitle) => {
  try {
    const response = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`
    );

    if (response.data) {
      const { title, extract: description, thumbnail } = response.data;
      const imageUrl = thumbnail?.source || null;

      // Set tooltip state with fetched data
      setHoveredLink(title);
      setHoveredDescription(description || 'No description available.');
      setHoveredImage(imageUrl);
    }
  } catch (error) {
    console.error('Error fetching tooltip data:', error);
    setHoveredDescription('Failed to load content.');
    setHoveredImage(null);
  }
};




    
    

    const resetGame = () => {
      console.log('Resetting game');
      setGameEnded(false);
      setClickCount(0);
      setTimer(0);
      setClickedLinks([]);
      setShowStartScreen(true);
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

      // Add event listeners to handle link clicks and tooltips
      link.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent full page reload
        e.stopPropagation(); // Stop event from bubbling to other handlers
        handleLinkClick(linkHref); // Use our custom link handler
      });
      link.addEventListener('mouseenter', () => handleMouseEnter(decodeURIComponent(linkHref.replace('/wiki/', '').replace(/_/g, ' '))));
      link.addEventListener('mouseleave', handleMouseLeave);
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
  {loading ? (
    <div className="loading-message">
      <h2>Loading...</h2>
    </div>
  ) : showStartScreen ? (
    <StartScreen
      startArticle={startArticle}
      setStartArticle={setStartArticle}
      endArticle={endArticle}
      setEndArticle={setEndArticle}
      onGameStart={(start, end) => {
        console.log("Game starting with:", start, end);
        setStartArticle(start);
        setEndArticle(end);
        setShowStartScreen(false);
        fetchPageContent(start.link); // Fetch the start article content
      }}
    />
  ) : (
    <div className="game-container">
      <Tooltip
        show={showHoveredContent}
        position={tooltipPosition}
        link={hoveredLink}
        image={hoveredImage}
        description={hoveredDescription}
      />
      <div className="gui-wrapper">
        {/* Game Header */}
        <div className="guiHeader">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.location.reload(); // Reload the page to return to the start page
            }}
          >
            <img
              src={BlueLinksLogo}
              alt="Blue Links Logo"
              style={{
                width: '210px',
                marginBottom: '20px',
              }}
            />
          </a>
        </div>

        {/* Game Metrics */}
        <div className="game-metrics">
          <div className="metric">
            <span className="metric-icon">⏱</span>
            <span className="metric-value">{formatTime(timer)}</span>
          </div>
          <div className="metric">
            <span className="metric-icon">🖱</span>
            <span className="metric-value">{clickCount}</span>
          </div>
        </div>

        {/* End Game Message */}
        {gameEnded ? (
          <div className="win-message">
            <h2>Congratulations!</h2>
            <p>You reached the end page.</p>
            <p>Time Taken: {formatTime(timer)}</p>
            <p>Number of Clicks: {clickCount}</p>
            <button onClick={resetGame}>Play Again</button>
          </div>
        ) : (
          // Article Progression (displayed only when the game is not ended)
          <div className="article-progression">
            {/* Scrollable container */}
            <div className="article-progression-scroll" ref={progressionContainerRef}>
              {/* Start Article */}
              <p className="article-title start-article">
                <a
                  href={`https://en.wikipedia.org${startArticle?.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {startArticle?.title || 'Start'}
                </a>
              </p>

              {/* First large dot after the starting article */}
              <span className="progress-dot large-dot"></span>

              {/* Clicked Links with alternating small dots */}
              {clickedLinks.map((link, index) => (
                <React.Fragment key={index}>
                  <p className="article-title">
                    <a
                      href={`https://en.wikipedia.org/wiki/${encodeURIComponent(link)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link}
                    </a>
                  </p>
                  <span
                    className={`progress-dot ${
                      index === clickedLinks.length - 1 ? 'large-dot' : 'small-dot'
                    }`}
                  ></span>
                </React.Fragment>
              ))}

              {/* End Article */}
              <p className="article-title end-article">
                <a
                  href={`https://en.wikipedia.org${endArticle?.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {endArticle?.title || 'End'}
                </a>
              </p>
            </div>
          </div>
        )}
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