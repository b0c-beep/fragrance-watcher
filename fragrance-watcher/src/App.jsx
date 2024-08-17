import './App.css'
import React, { useEffect, useState } from 'react';

function App() {
  const [prices, setPrices] = useState({});

  useEffect(() => {
      fetch('http://127.0.0.1:5000/api/prices')
          .then(response => response.json())
          .then(data => setPrices(data))
          .catch(error => console.error('Error fetching prices:', error));
  }, []);

  return (
      <div>
          <h1>Fragrance Prices</h1>
          {Object.keys(prices).map(fragrance => (
              <div key={fragrance}>
                  <h2>{fragrance}</h2>
                  <ul>
                      {Object.keys(prices[fragrance]).map(site => (
                          <li key={site}>
                              {site}: {prices[fragrance][site] || 'Price not found'}
                          </li>
                      ))}
                  </ul>
              </div>
          ))}
      </div>
  );
}

export default App
