import React, { useState, useEffect } from 'react';
import FragranceCard from './FragranceCard';

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
            setPrices(data);
            localStorage.setItem('prices', JSON.stringify(data)); // Save to local storage
        } catch (err) {
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Group prices by fragrance
    const groupedPrices = prices.reduce((acc, price) => {
        if (price && price.fragrance) {
            if (!acc[price.fragrance]) {
                acc[price.fragrance] = [];
            }
            acc[price.fragrance].push(price);
        }
        return acc;
    }, {});

    return (
        <div>
            <button onClick={handleRunScript} disabled={loading}>
                {loading ? 'Running...' : 'Run Script'}
            </button>
            {error && <p>{error}</p>}

            {/* Render fragrance cards */}
            <div>
                {Object.keys(groupedPrices).map((fragrance, index) => (
                    <FragranceCard
                        key={index}
                        fragrance={fragrance}
                        prices={groupedPrices[fragrance]}
                        imageUrl={`https://via.placeholder.com/150?text=${encodeURIComponent(fragrance)}`}
                    />
                ))}
            </div>
        </div>
    );
}

export default App;
