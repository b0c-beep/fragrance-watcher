import React from 'react';
import './Navbar.css'; // Make sure to create and import a CSS file for styling

function Navbar({ onAddFragrance, onDeleteFragrance, onEditFragrance }) {
    return (
        <nav className="navbar">
            <div className="navbar-left">
                <h1 className="navbar-title">Fragrance Watcher</h1>
            </div>
            <div className="navbar-right">
                <button className="navbar-button" onClick={onAddFragrance}>
                    Add
                </button>
                <button className="navbar-button" onClick={onDeleteFragrance}>
                    Delete
                </button>
                <button className='navbar-button' onClick={onEditFragrance}>
                    Edit
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
