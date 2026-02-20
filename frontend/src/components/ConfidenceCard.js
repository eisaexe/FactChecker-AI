import React from 'react';
import './ConfidenceCard.css';

function ConfidenceCard({ confidence }) {
  const getConfidenceLevel = (score) => {
    if (score > 75) return 'High Confidence';
    if (score > 45) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  const getConfidenceColor = (score) => {
    if (score > 75) return '#10b981';
    if (score > 45) return '#f59e0b';
    return '#ef4444';
  };

  const level = getConfidenceLevel(confidence);
  const color = getConfidenceColor(confidence);

  return (
    <div className="confidence-card">
      <div className="confidence-header">
        <h3>📊 Confidence Level</h3>
        <span className="confidence-percentage" style={{ color }}>{confidence}%</span>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${confidence}%`, backgroundColor: color }}
          ></div>
        </div>
      </div>

      <div className="confidence-level" style={{ color }}>
        {level}
      </div>

      <div className="confidence-description">
        <p>
          {confidence > 75
            ? 'The analysis is based on strong evidence from multiple sources.'
            : confidence > 45
            ? 'The analysis is based on available evidence, but some uncertainty remains.'
            : 'Limited evidence available. Results should be verified independently.'}
        </p>
      </div>
    </div>
  );
}

export default ConfidenceCard;
