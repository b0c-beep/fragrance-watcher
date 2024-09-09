import React, { useState, useEffect } from 'react';
import './EditModal.css'; // Make sure to create and import a CSS file for styling

function EditModal({ isOpen, onClose }) {

    const [chosenFragrance, setChosenFragrance] = useState('');
    const [fragrances, setFragrances] = useState([]);
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


    useEffect(() => {
        if (isOpen) {

            document.querySelectorAll('.form-group').forEach((element) => {
                element.style.display = 'none';
            });
            
            document.querySelector('.save-button').style.display = 'none';  

            // Fetch fragrance names from the new endpoint
            const fetchFragrances = async () => {
                try {
                    const response = await fetch('http://localhost:5000/fragrance-names');
                    if (response.ok) {
                        const data = await response.json();
                        setFragrances(data);
                    } else {
                        console.error('Failed to fetch fragrance names:', await response.text());
                    }
                } catch (error) {
                    console.error('Error fetching fragrance names:', error);
                }
            };

            fetchFragrances();
        }

    }, [isOpen]);


    const loadFragranceImage = (fragranceName) => {
        const extensions = ['.jpg', '.png', '.jpeg', '.gif']; // Possible image extensions
        for (const ext of extensions) {
            const imagePath = `/images/${fragranceName}${ext}`; // Directly reference the public folder
            const img = new Image();
            img.src = imagePath;
            img.onload = () => setImage(imagePath); // If image loads successfully
        }
    };


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


    const handleSelect = async () => {

        if (!chosenFragrance) return alert('Please select a fragrance to edit.');  // Ensure a fragrance is selected

        try {
            const response = await fetch(`http://localhost:5000/fragrances/${chosenFragrance}`);
            if (response.ok) {
                const fragranceData = await response.json();
    
                // Populate form fields with fetched data
                setTitle(chosenFragrance); // Set the title as the fragrance name
                setQuantity(fragranceData.quantity || '');
                
                // Populate links
                const linksData = Object.keys(links).reduce((acc, site) => {
                    acc[site] = {
                        url: fragranceData[site]?.url || '',
                        price_selector: fragranceData[site]?.price_selector || '',
                    };
                    return acc;
                }, {});
    
                setLinks(linksData);

                loadFragranceImage(chosenFragrance);
    
                // Show form fields after selection
                document.querySelector('#fragrance-select').style.display = 'none';
                document.querySelectorAll('.form-group').forEach((element) => {
                    element.style.display = 'block';
                });
                document.querySelector('.select-button').style.display = 'none';
                document.querySelector('.save-button').style.display = 'block';
            } else {
                console.error('Failed to fetch fragrance details:', await response.text());
            }
        } catch (error) {
            console.error('Error fetching fragrance details:', error);
        }
    

    }


    const handleSave = async () => {



    }


    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Edit Fragrance</h2>
                <form>
                    <select name="fragrance-select" id="fragrance-select" 
                            value={chosenFragrance} onChange={(e) => setChosenFragrance(e.target.value)}>

                        {fragrances.map((fragrance, index) => (
                            <option key={index} value={fragrance}>{fragrance}</option>
                        ))}
                            
                    </select>
                    
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

                </form>

                

                <div className="modal-buttons">
                        <button className='select-button' type="button" onClick={handleSelect}>Select Fragrance</button>
                        <button className='save-button' type="button" onClick={handleSave}>Save</button>
                        <button className='close-button' type="button" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default EditModal;
