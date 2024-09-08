import React, { useState } from 'react';
import './Modal.css'; // Make sure to create and import a CSS file for styling

function Modal({ isOpen, onClose }) {
    const [image, setImage] = useState(null);
    const [title, setTitle] = useState('');
    const [quantity, setQuantity] = useState('');
    const [links, setLinks] = useState({
        "brasty.ro": { url: '', price_selector: '.c-pd-shopbox__row' },
        "hiris.ro": { url: '', price_selector: '.custom-tag-price' },
        "esentedelux.ro": { url: '', price_selector: '.product-price.current-price-value' },
        "notino.ro": { url: '', price_selector: '#pd-price' },
        "parfumss.ro": { url: '', price_selector: '.price' },
        "parfimo.ro": { url: '', price_selector: '.Price.ProductRow-price.js-price' },
        "makeup.ro": { url: '', price_selector: '.price_item' },
        "vivantis.ro": { url: '', price_selector: '.lh-18.font-size-sm.fw-bold' },
        "bestvalue.eu": { url: '', price_selector: '#product-price' },
        "parfumuri_timisoara.ro": { url: '', price_selector: '.price' },
        "deluxury.ro": { url: '', price_selector: '' },
        "parfumat.ro": { url: '', price_selector: '' },
        "parfumu.ro": { url: '', price_selector: '.ty-price-num' },
        "obsentum.com": { url: '', price_selector: '.cstm-product-summary.cstm-product-summary-no-mk' },
        "sephora.ro": { url: '', price_selector: '.price-sales.price-sales-standard' },
        "douglas.ro": { url: '', price_selector: '.product-detail-price.neutralColor' },
        "beautik.ro": { url: '', price_selector: '' },
        "parfumy.ro": { url: '', price_selector: '' },
        "marionnaud.ro": { url: '', price_selector: '.formatted-price__decimal' },
        "simplestore.ro": { url: '', price_selector: '.priceprodnormal.pret-normal-tva.pretpagprod' },
        "depozituldecosmetice.ro": { url: '', price_selector: '.price' }
    });

    const handleImageChange = (event) => {
        if (event.target.files.length > 0) {
            setImage(event.target.files[0]);
        }
    };

    const handleLinkChange = (site, field, value) => {
        setLinks(prevLinks => ({
            ...prevLinks,
            [site]: {
                ...prevLinks[site],
                [field]: value
            }
        }));
    };

    const handleSubmit = async () => {

        // Construct the new fragrance object
        const newFragrance = {
            [title.replace(/\s+/g, '_').toLowerCase()]: {
                quantity,
                ...links  // Spread the flattened links directly here
            }
        };
    
        try {
            const response = await fetch('http://localhost:5000/fragrances', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newFragrance)
            });
    
            if (!response.ok) {
                // Handle non-2xx HTTP responses
                const errorText = await response.text();
                console.error('Failed to add fragrance:', errorText);
                alert(`Failed to add fragrance: ${errorText}`);
                return;
            }
    
            // Success: Fragrance added successfully
            console.log('Fragrance added successfully');

            // If there is an image, upload it separately
            if (image) {
                const formData = new FormData();
                formData.append('image', image);  // Append the image to the FormData
                formData.append('title', title);  // Append the title or any other identifier

                if (!title) {
                    console.error('Title is required');
                    return;
                }

                const imageResponse = await fetch('http://localhost:5000/upload-image', {
                    method: 'POST',
                    body: formData
                });

                if (!imageResponse.ok) {
                    const errorText = await imageResponse.text();
                    console.error('Failed to upload image:', errorText);
                    alert(`Failed to upload image: ${errorText}`);
                    return;
                }

                console.log('Image uploaded successfully');
            }

            // Clear the form fields
            setImage(null);
            setTitle('');
            setQuantity('');
            setLinks({
                "brasty.ro": { url: '', price_selector: '.c-pd-shopbox__row' },
                "hiris.ro": { url: '', price_selector: '.custom-tag-price' },
                "esentedelux.ro": { url: '', price_selector: '.product-price.current-price-value' },
                "notino.ro": { url: '', price_selector: '#pd-price' },
                "parfumss.ro": { url: '', price_selector: '.price' },
                "parfimo.ro": { url: '', price_selector: '.Price.ProductRow-price.js-price' },
                "makeup.ro": { url: '', price_selector: '.price_item' },
                "vivantis.ro": { url: '', price_selector: '.lh-18.font-size-sm.fw-bold' },
                "bestvalue.eu": { url: '', price_selector: '#product-price' },
                "parfumuri_timisoara.ro": { url: '', price_selector: '.price' },
                "deluxury.ro": { url: '', price_selector: '' },
                "parfumat.ro": { url: '', price_selector: '' },
                "parfumu.ro": { url: '', price_selector: '.ty-price-num' },
                "obsentum.com": { url: '', price_selector: '.cstm-product-summary.cstm-product-summary-no-mk' },
                "sephora.ro": { url: '', price_selector: '.price-sales.price-sales-standard' },
                "douglas.ro": { url: '', price_selector: '.product-detail-price.neutralColor' },
                "beautik.ro": { url: '', price_selector: '' },
                "parfumy.ro": { url: '', price_selector: '' },
                "marionnaud.ro": { url: '', price_selector: '.formatted-price__decimal' },
                "simplestore.ro": { url: '', price_selector: '.priceprodnormal.pret-normal-tva.pretpagprod' },
                "depozituldecosmetice.ro": { url: '', price_selector: '.price' }
            });

            onClose();  // Close the modal only after a successful addition
        } catch (error) {
            // Handle network errors or JSON parsing errors
            console.error('Error:', error);
            console.log('Failed to add fragrance. Please try again later.');
        }
    };
    

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Add New Fragrance</h2>
                <form>
                    <div className="form-group">
                        <label htmlFor="image">Image:</label>
                        <input type="file" id="image" accept="image/*" onChange={handleImageChange} />
                        {image && <img src={image} alt="Preview" className="image-preview" />}
                    </div>
                    <div className="form-group">
                        <label htmlFor="title">Title:</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="quantity">Quantity:</label>
                        <input
                            type="text"
                            id="quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </div>
                    {Object.keys(links).map((site) => (
                        <div className="form-group" key={site}>
                            <label htmlFor={`${site}-url`}>{site} URL:</label>
                            <input
                                type="text"
                                id={`${site}-url`}
                                value={links[site].url}
                                onChange={(e) => handleLinkChange(site, 'url', e.target.value)}
                            />
                        </div>
                    ))}
                    <div className="modal-buttons">
                        <button type="button" onClick={handleSubmit}>Add Fragrance</button>
                        <button type="button" onClick={onClose}>Close</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Modal;
