import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const fetchPrices = async () => {
    try {
        // Read the JSON file
        const data = await fs.readFile('fragrances.json', 'utf-8');
        const fragrances = JSON.parse(data);
        
        // Launch the browser
        const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
        const page = await browser.newPage();

        // Iterate through each fragrance
        for (const [fragrance, stores] of Object.entries(fragrances)) {
            console.log(`Fetching prices for: ${fragrance}`);
            for (const [store, details] of Object.entries(stores)) {
                if (details.url && details.price_selector) {
                    console.log(`Fetching from ${store}...`);
                    try {
                        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                        
                        // Fetch the price using the selector
                        const price = await page.evaluate((selector) => {
                            const priceElement = document.querySelector(selector);
                            return priceElement ? priceElement.innerText.trim() : 'Price not found';
                        }, details.price_selector);

                        console.log(`Price at ${store}: ${price}`);
                    } catch (error) {
                        console.error(`Error fetching price from ${store}:`, error);
                    }
                } else {
                    console.warn(`Missing URL or selector for ${store}`);
                }
            }
        }

        // Close the browser
        await browser.close();
    } catch (error) {
        console.error('Error reading JSON file or initializing Puppeteer:', error);
    }
};

fetchPrices();
