import React, { useState } from 'react';
import './SearchResultsCard.css';

function SearchResultsCard({ results }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="search-results-card">
      <div className="card-header">
        <h3>📚 Web Evidence</h3>
        <span className="results-count">{results?.length || 0}</span>
      </div>

      <div className="results-container">
        {results && results.length > 0 ? (
          results.map((result, index) => (
            <div
              key={index}
              className={`result-item ${expandedIndex === index ? 'expanded' : ''}`}
            >
              <div
                className="result-header"
                onClick={() => toggleExpand(index)}
              >
                <div className="result-title-section">
                  <h4 className="result-title">{result.title}</h4>
                  <p className="result-url">{result.url}</p>
                </div>
                <button className="expand-button">
                  {expandedIndex === index ? '▼' : '▶'}
                </button>
              </div>

              {expandedIndex === index && (
                <div className="result-content">
                  <p>{result.content}</p>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="read-more-link"
                  >
                    Read Full Article →
                  </a>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="no-results">No search results available</p>
        )}
      </div>
    </div>
  );
}

export default SearchResultsCard;
