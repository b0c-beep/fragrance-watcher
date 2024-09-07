import React from 'react';
import './Navbar.css'; // Make sure to create and import a CSS file for styling

function Navbar({ onAddFragrance }) {
    return (
        <nav className="navbar">
            <div className="navbar-left">
                <h1 className="navbar-title">Fragrance Watcher</h1>
            </div>
            <div className="navbar-right">
                <button className="navbar-button" onClick={onAddFragrance}>
                    Add New Fragrance
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
