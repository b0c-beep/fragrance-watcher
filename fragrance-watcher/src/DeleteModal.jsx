import React, { useState, useEffect } from 'react';
import './DeleteModal.css'; // Make sure to create and import a CSS file for styling

function DeleteModal({ isOpen, onClose }) {
    const [chosenFragrance, setChosenFragrance] = useState('');
    const [fragrances, setFragrances] = useState([]);

    useEffect(() => {
        if (isOpen) {

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

    const handleDelete = async () => {

        if (!chosenFragrance) return alert('Please select a fragrance to delete.');  // Ensure a fragrance is selected

        try {
            const response = await fetch(`http://localhost:5000/fragrances/${chosenFragrance}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log(`Fragrance "${chosenFragrance}" deleted successfully.`);
                // Optionally update the UI after successful deletion
                setChosenFragrance(''); // Clear selection
                const updatedFragrances = fragrances.filter(f => f !== chosenFragrance);
                setFragrances(updatedFragrances);
                onClose();
            } else {
                console.error(`Failed to delete fragrance: ${await response.text()}`);
            }
        } catch (error) {
            console.error('Error deleting fragrance:', error);
        }

    }

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Select fragrance to delete</h2>
                <form>
                    <select name="fragrance-select" id="fragrance-select" 
                            value={chosenFragrance} onChange={(e) => setChosenFragrance(e.target.value)}>

                        {fragrances.map((fragrance, index) => (
                            <option key={index} value={fragrance}>{fragrance}</option>
                        ))}
                            
                    </select>
                    <div className="modal-buttons">
                        <button type="button" onClick={handleDelete}>Delete Fragrance</button>
                        <button type="button" onClick={onClose}>Close</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DeleteModal;
