import React from 'react';
import './SearchBar.css';

function SearchBar({ query, onQueryChange, onSearch, loading }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      onSearch(query);
    }
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter a claim or question to fact-check..."
          disabled={loading}
          className="search-input"
        />
        <button
          onClick={() => onSearch(query)}
          disabled={loading}
          className="search-button"
        >
          {loading ? '⏳ Checking...' : '🔎 Fact Check'}
        </button>
      </div>
      <p className="search-hint">Example: "Is the Earth flat?" or "Did humans land on the moon?"</p>
    </div>
  );
}

export default SearchBar;
