import React from 'react';
import './FragranceCard.css';

function FragranceCard({ fragrance, prices, imageUrl }) {    

    return (
        <div className="fragrance-card">
            {/* Left side: Image and Title */}
            <div className="fragrance-card-display">
                <img src={imageUrl} alt={fragrance} />
                
            </div>

            {/* Right side: List of Prices */}
            <div className="fragrance-card-details">
                <h4>Prices from stores for {fragrance}:</h4>
                <ul className="fragrance-card-price-list">
                    {prices.map((price, index) => (
                        <li key={index}>
                            <strong>Store:</strong> {price.store}, <strong>Price:</strong> {price.price}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}


export default FragranceCard;
