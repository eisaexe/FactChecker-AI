import React from 'react';
import './CitationsCard.css';

function CitationsCard({ citations }) {
  const getSourceName = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return 'Source';
    }
  };

  return (
    <div className="citations-card">
      <div className="card-header">
        <h3>🔗 Citations</h3>
        <span className="citation-count">{citations.length}</span>
      </div>

      <div className="citations-list">
        {citations && citations.length > 0 ? (
          citations.map((citation, index) => (
            <a
              key={index}
              href={citation}
              target="_blank"
              rel="noopener noreferrer"
              className="citation-item"
              title={citation}
            >
              <div className="citation-icon">🌐</div>
              <div className="citation-info">
                <p className="citation-source">{getSourceName(citation)}</p>
                <p className="citation-url">{citation.substring(0, 60)}...</p>
              </div>
              <div className="citation-arrow">→</div>
            </a>
          ))
        ) : (
          <p className="no-citations">No citations available</p>
        )}
      </div>
    </div>
  );
}

export default CitationsCard;
