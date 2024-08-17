import './App.css'
import React, { useEffect, useState } from 'react';

function App() {
  const [prices, setPrices] = useState({});
    const [fragrance, setFragrance] = useState('ysl_myslf_refill_150ml'); // Default fragrance

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/prices/${fragrance}`);
                const data = await response.json();
                setPrices(data);
            } catch (error) {
                console.error('Error fetching prices:', error);
            }
        };

        fetchPrices();
    }, [fragrance]);

    return (
        <div>
            <h1>Fragrance Price Tracker</h1>
            <label>
                Select Fragrance:
                <select value={fragrance} onChange={(e) => setFragrance(e.target.value)}>
                    <option value="ysl_myslf_refill_150ml">YSL MySLF Refill 150ml</option>
                    {/* Add more options here */}
                </select>
            </label>
            <div>
                <h2>Prices:</h2>
                <ul>
                    {Object.entries(prices).map(([store, price]) => (
                        <li key={store}>
                            {store}: {price}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default App
