import React from 'react';
import './LoadingSpinner.css';

function LoadingSpinner() {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <div className="spinner-text">
        <p>Searching the web and analyzing evidence...</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
