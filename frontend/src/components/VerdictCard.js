import React from 'react';
import './VerdictCard.css';

function VerdictCard({ verdict }) {
  const isReal = verdict === 'Real';

  return (
    <div className={`verdict-card verdict-${isReal ? 'real' : 'cap'}`}>
      <div className="verdict-icon">
        {isReal ? '✅' : '❌'}
      </div>
      <div className="verdict-text">
        <p className="verdict-label">Verdict</p>
        <p className="verdict-value">{verdict}</p>
      </div>
      <div className={`verdict-badge ${isReal ? 'real' : 'cap'}`}>
        {isReal ? 'VERIFIED' : 'FALSE'}
      </div>
    </div>
  );
}

export default VerdictCard;
