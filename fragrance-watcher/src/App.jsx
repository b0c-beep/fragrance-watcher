// src/App.jsx
import React, { useState, useEffect } from 'react';

function App() {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load data from local storage on component mount
    useEffect(() => {
    const savedPrices = localStorage.getItem('prices');
        if (savedPrices) {
        setPrices(JSON.parse(savedPrices));
        }
    }, []);

    const handleRunScript = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/run-script');
        
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            //console.log(data);
            setPrices(data);
            localStorage.setItem('prices', JSON.stringify(data)); // Save to local storage


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
            price && price.fragrance && price.store && price.price ? (
                <li key={index}>
                <strong>Fragrance:</strong> {price.fragrance}, <strong>Store:</strong> {price.store}, <strong>Price:</strong> {price.price}
                </li>
            ) : (
                <li key={index}>
                <em>Invalid data</em>
                </li>
            )
            ))}
        </ul>
        </div>
    );
}

export default App;
