import React from 'react';
import './ExplanationCard.css';

function ExplanationCard({ explanation }) {
  return (
    <div className="explanation-card">
      <div className="card-header">
        <h3>🧠 Explanation</h3>
      </div>
      <div className="explanation-content">
        <p>{explanation}</p>
      </div>
    </div>
  );
}

export default ExplanationCard;
