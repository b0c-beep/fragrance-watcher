// backend/server.js
const express = require('express');
const fs = require('fs');
const cheerio = require('cheerio');

const app = express();
const PORT = 5000;

app.use(express.json());

const FRAGRANCES_PATH = '../fragrances.json';

// Read the fragrances JSON file
const fragrances = JSON.parse(fs.readFileSync(FRAGRANCES_PATH, 'utf-8'));

// Function to fetch the price from a URL
const fetchPrice = async (url, selector) => {
    try {
        const { default: fetch } = await import('node-fetch');
        const response = await fetch(url);
        const body = await response.text();
        const $ = cheerio.load(body);
        return $(selector).text().trim();
    } catch (error) {
        console.error('Error fetching price:', error);
        return 'Unavailable';
    }
};

// Endpoint to get prices for a specific fragrance
app.get('/api/prices/:fragrance', async (req, res) => {
    const fragranceId = req.params.fragrance;
    const fragranceData = fragrances[fragranceId];

    if (!fragranceData) {
        return res.status(404).json({ error: 'Fragrance not found' });
    }

    const prices = {};
    for (const [store, { url, price_selector }] of Object.entries(fragranceData)) {
        if (url && price_selector) {
            prices[store] = await fetchPrice(url, price_selector);
        } else {
            prices[store] = 'URL or selector missing';
        }
    }

    res.json(prices);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
