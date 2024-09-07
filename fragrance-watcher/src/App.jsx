import React, { useState, useEffect } from 'react';
import FragranceCard from './FragranceCard';
import './App.css';
import Navbar from './Navbar';
import Modal from './Modal';

function App() {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Load data from local storage on component mount
    useEffect(() => {
        const savedPrices = localStorage.getItem('prices');
        if (savedPrices) {
            setPrices(JSON.parse(savedPrices));
        }
    }, []);

    const extractPriceValue = (price) => {
        const number = parseFloat(price.replace(/[^0-9.,]/g, '').replace(',', '.'));
        return isNaN(number) ? 0 : number;
    };
    

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


    const sortedGroupedPrices = Object.keys(groupedPrices).reduce((acc, fragrance) => {
        acc[fragrance] = groupedPrices[fragrance].sort((a, b) => {
            return extractPriceValue(a.price) - extractPriceValue(b.price);
        });
        return acc;
    }, {});


    return (
        <div>
            <Navbar onAddFragrance={() => setIsModalOpen(true)} />
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
            <button onClick={handleRunScript} disabled={loading}>
                {loading ? 'Fetching...' : 'Fetch Prices'}
            </button>
            {error && <p>{error}</p>}

            {/* Render fragrance cards */}
            <div className="fragrance-group">
                {Object.keys(sortedGroupedPrices).map((fragrance, index) => (
                    <FragranceCard
                        key={index}
                        fragrance={fragrance}
                        prices={sortedGroupedPrices[fragrance]}
                        imageUrl={`/images/${fragrance.replace(/\s+/g, '_').toLowerCase()}.jpg` 
                        || `/images/${fragrance.replace(/\s+/g, '_').toLowerCase()}.png`}
                    />
                ))}
            </div>
        </div>
    );
}

export default App;
