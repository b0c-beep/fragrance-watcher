import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { parse } from 'path';

const basicFetch = async (page, store, details, fragrance, quantity) => {
    try {
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                        
        // Fetch the price using the selector
        const price = await page.evaluate((selector) => {
            const priceElement = document.querySelector(selector);
            return priceElement ? priceElement.innerText.trim() : 'Price not found';
        }, details.price_selector);

        console.log(`Price at ${store} for ${fragrance}: ${price}`);
    } catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}

const sephoraFetch = async (page, store, details, fragrance, quantity) => {
    try {
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Check if there is a dropdown element
        const dropdownElement = await page.$('.variations-size-selected');
        if (dropdownElement) {
            // Toggle the dropdown to reveal all options
            await dropdownElement.click();
            console.log('Dropdown clicked');
        }

        // Find the correct variation based on quantity
        const selectedPrice = await page.evaluate((quantity, priceSelector) => {
            const variationElements = document.querySelectorAll('.variation-button-line');
            let selectedPrice = 'Price not found';

            let specificSpan = "";

            variationElements.forEach(variation => {

                const spans = variation.querySelectorAll('.variation-title span');

                

                spans.forEach(span => {
                    if (!span.id && !span.className) {
                        specificSpan = span;
                    }
                });

                /*
                if (specificSpan.includes(parseInt(quantity))) {
                    selectedPrice = variation.querySelector(priceSelector).innerText.trim();
                }
                */
            });
            
            return specificSpan;
            //return selectedPrice;
        }, quantity, details.price_selector);

        console.log("Selected price: ", selectedPrice);
        //console.log(`Price at ${store} for ${fragrance}: ${selectedPrice}`);
    } catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}

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
            const quantity = stores.quantity; // Get the quantity for the current fragrance
            console.log(`Fetching prices for: ${fragrance}`);
            for (const [store, details] of Object.entries(stores)) {
                if (store === "quantity") continue; // Skip the quantity key
                
                if (details.url && details.price_selector) {
                    console.log(`Fetching from ${store}...`);
                    if (store !== 'sephora.ro' && store !== 'douglas.ro' 
                        && store !== 'notino.ro' && store !== 'marionnaud.ro'
                        && store !== 'parfumuri-timisoara.ro') {
                        await basicFetch(page, store, details, fragrance, quantity);
                    } else if (store === 'sephora.ro') {
                        await sephoraFetch(page, store, details, fragrance, quantity);
                    }
                } else {
                    //console.warn(`Missing URL or selector for ${store}`);
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
