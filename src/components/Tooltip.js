import React, { useEffect, useRef, useState } from 'react';

const Tooltip = ({ show, position, link, image, description }) => {
  const tooltipRef = useRef(null);
  const [adjustedStyles, setAdjustedStyles] = useState({
    top: '0px',
    left: '0px',
    visibility: 'hidden', // Initially hidden
  });

  useEffect(() => {
    if (show && tooltipRef.current && link && description) {
      const tooltipWidth = tooltipRef.current.offsetWidth || 200;
      const tooltipHeight = tooltipRef.current.offsetHeight || 100;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = position.y;
      let left = position.x;

      // Adjust for viewport edges
      if (left + tooltipWidth > viewportWidth) left = viewportWidth - tooltipWidth - 10;
      if (top + tooltipHeight > viewportHeight) top -= tooltipHeight;
      if (left < 10) left = 10;
      if (top < 10) top = 10;

      setAdjustedStyles({ top: `${top}px`, left: `${left}px`, visibility: 'visible' });
    } else {
      setAdjustedStyles({ top: '0px', left: '0px', visibility: 'hidden' });
    }
  }, [show, position, link, description]);

  // Don't render tooltip unless all content is ready
  if (!show || !link || !description) return null;

  return (
    <div ref={tooltipRef} className="hovered-content" style={{ ...adjustedStyles, position: 'absolute', zIndex: 1000 }}>
      <h1 style={{ color: '#457DFF', fontWeight: 'bold' }}>{link}</h1>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {image && <img src={image} alt="Hovered article thumbnail" style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }} />}
        <p className="tooltip-description">{description}</p>
      </div>
    </div>
  );
};

export default Tooltip;
