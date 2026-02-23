import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import SearchBar from './components/SearchBar';
import LoadingSpinner from './components/LoadingSpinner';
import VerdictCard from './components/VerdictCard';
import ConfidenceCard from './components/ConfidenceCard';
import ExplanationCard from './components/ExplanationCard';
import CitationsCard from './components/CitationsCard';
import SearchResultsCard from './components/SearchResultsCard';

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFactCheck = async (inputQuery) => {
    if (!inputQuery.trim()) {
      setError('Please enter a claim or question');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('/api/fact-check', { query: inputQuery });
      setResult(response.data);
      setQuery('');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while checking the fact.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
    setQuery('');
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🧠 Real or Cap</h1>
          <p>AI-Powered Fact Checker with Live Web Evidence</p>
        </div>
      </header>

      <main className="app-main">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          onSearch={handleFactCheck}
          loading={loading}
        />

        {error && (
          <div className="error-notification">
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {loading && <LoadingSpinner />}

        {result && !loading && (
          <div className="results-container">
            <div className="results-grid">
              <div className="main-verdict">
                <VerdictCard verdict={result.verdict} />
                <ConfidenceCard confidence={result.confidence} />
              </div>

              <div className="details-section">
                <ExplanationCard explanation={result.explanation} />
              </div>
            </div>

            <div className="supporting-grid">
              <CitationsCard citations={result.citations} />
              <SearchResultsCard results={result.searchResults} />
            </div>

            <button className="clear-button" onClick={handleClear}>
              ← Check Another Claim
            </button>
          </div>
        )}

        {!result && !loading && !error && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h2>Start Fact Checking</h2>
            <p>Enter a claim or question above to verify its accuracy</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by san.d.osh & eisa.exe | Fact checking with evidence-based reasoning</p>
      </footer>
    </div>
  );
}

export default App;
