import React from 'react';
import './FragranceCard.css';

function FragranceCard({ fragrance, prices, imageUrl }) { 
    
    const formatFragranceName = (name) => {
        return name
            .replace(/_/g, ' ')  // Replace underscores with spaces
            .replace(/\b\w/g, (char) => char.toUpperCase());  // Capitalize the first letter of each word
    };

    return (
        <div className="fragrance-card">
            {/* Left side: Image and Title */}
            <div className="fragrance-card-display">
                <img src={imageUrl} alt={fragrance} />
                
            </div>

            {/* Right side: List of Prices */}
            <div className="fragrance-card-details">
                <h4>Prices from stores for <span className='fragrance-card-name'>{formatFragranceName(fragrance)}</span>:</h4>
                <ul className="fragrance-card-price-list">
                    {prices.map((price, index) => (
                        <li key={index}>
                            <strong>Store: </strong>
                            <a href={price.url} target="_blank" rel="noopener noreferrer" className='fragrance-card-link'>
                                {price.store}
                            </a>, 
                            <strong> Price:</strong> {price.price}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}


export default FragranceCard;
