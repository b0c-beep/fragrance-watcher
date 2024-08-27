// src/App.jsx
import React, { useState } from 'react';

function App() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRunScript = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/run-script', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setPrices(data);
      } else {
        setError('Unexpected data format');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleRunScript} disabled={loading}>
        {loading ? 'Running...' : 'Run Script'}
      </button>
      {error && <p>{error}</p>}
      <ul>
        {prices.map((price, index) => (
          <li key={index}>
            <strong>Fragrance:</strong> {price.fragrance}, <strong>Store:</strong> {price.store}, <strong>Price:</strong> {price.price}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
