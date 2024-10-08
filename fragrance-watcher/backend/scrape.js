import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import psTree from 'ps-tree';
import { url } from 'inspector';

// Apply stealth plugin to Puppeteer
puppeteer.use(StealthPlugin());

let browser;

function isNumeric(str) {
    return /^\d+$/.test(str);
}

function containsNumber(str) {
    return /\d/.test(str);
}

const basicFetch = async (page, store, details, fragrance, quantity) => {
    try {
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                        
        // Fetch the price using the selector
        let price = await page.evaluate((selector) => {
            const priceElement = document.querySelector(selector);
            return priceElement ? priceElement.innerText.trim() : 'Price not found';
        }, details.price_selector);

        console.log(`\x1b[32mPrice at ${store} for ${fragrance}: ${price}\x1b[0m`);
        return { fragrance, store, price, url: details.url };
    } catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}


const douglasFetch = async (page, store, details, fragrance, quantity) => {
    const fileName = `${fragrance.replace(/\s+/g, '_')}_${store.replace(/\./g, '_')}.html`;
    try {
        // Fetch the HTML of the page using axios
        const response = await axios.get(details.url);
        const html = response.data;

        // Save the HTML to a local file
        await fs.writeFile(fileName, html);
        //console.log(`Saved HTML to ${fileName}`);

        // Load the HTML into cheerio
        const $ = cheerio.load(html);

        let price = 'Price not found';

        const parentElements = $('div.d-flex.flex-row.justify-content-between');
        parentElements.each((index, element) => {
            
            const quantityElement = $(element).find('div.price-unit-content');
            if(quantityElement.text().includes(parseInt(quantity))) {
                const priceElement = $(element).find('p.product-detail-price');
                if (priceElement) {
                    price = priceElement.text().trim();
                }
            }

        });

        console.log(`\x1b[32mPrice at ${store} for ${fragrance}: ${price}\x1b[0m`);
        return { fragrance, store, price, url: details.url };
    } catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    } finally {
        try {
            // Delete the local HTML file after processing
            await fs.unlink(fileName);
            //console.log(`Deleted local file ${fileName}`);
        } catch (deleteError) {
            console.error(`Error deleting file ${fileName}:`, deleteError);
        }
    }
}


const notinoFetch = async (page, store, details, fragrance, quantity) => {
    try{
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        let price = 'Price not found';

        const priceElement = await page.$(details.price_selector);
        if(priceElement){
            const childElements = await priceElement.$$('*');
            for (const childElement of childElements) {
                const innerText = await childElement.evaluate(node => node.innerText.trim());
                if (/\d+/.test(innerText)) { // innerText includes numbers
                    price = innerText.trim() + ' RON';
                }   
            }
        }

        console.log(`\x1b[32mPrice at ${store} for ${fragrance}: ${price}\x1b[0m`);
        return { fragrance, store, price, url: details.url };
    }
    catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}


const marionnaudFetch = async (page, store, details, fragrance, quantity) => {
    try {
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        let price = 'Price not found';

        const results = await page.evaluate(() => {
            // Select all elements with itemprop="price"
            const priceElements = document.querySelectorAll('[itemprop="price"]');
            const descriptionElements = document.querySelectorAll('[itemprop="disambiguatingDescription"]');
    
            // Create an array to store the results
            const items = [];
    
            // Iterate over the price elements and extract the corresponding description
            priceElements.forEach((priceElement, index) => {
                const price = priceElement.textContent.trim();
                const description = descriptionElements[index] ? descriptionElements[index].textContent.trim() : 'No description';
                items.push({ price, description });
            });
    
            return items; // Return the array of items
        });
    
        // Output the results
        results.forEach((item, index) => {
            if(item.description.includes(parseInt(quantity))) {
                price = item.price + ' RON';
            }
        });

        console.log(`\x1b[32mPrice at ${store} for ${fragrance}: ${price}\x1b[0m`);
        return { fragrance, store, price, url: details.url };
    } catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}


const hirisFetch = async (page, store, details, fragrance, quantity) => {
    try{
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        let price = 'Price not found';

        const productVariants = await page.$$('.custom-tag-label');
        for (let productVariant of productVariants){
            const variantWeight = await productVariant.$('.custom-tag-weight');
            if(variantWeight){
                const weightText = await variantWeight.evaluate(node => node.innerText.trim());
                const variantPrice = await productVariant.$('.custom-tag-price');
                const priceText = await variantPrice.evaluate(node => node.innerText.trim());
                if(weightText.includes(parseInt(quantity))){
                    price = priceText;
                    break;
                }
            }
        }

        console.log(`\x1b[32mPrice at ${store} for ${fragrance}: ${price}\x1b[0m`);
        return { fragrance, store, price, url: details.url };
    }catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}


const parfumuFetch = async (page, store, details, fragrance, quantity) => {
    try {
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        let price = 'Price not found';                
    
        const productVariants = await page.$$('.ty-compact-list__content');
        for (let productVariant of productVariants){
            const variantTitle = await productVariant.$('.product_title');
            const titleText = await variantTitle.evaluate(node => node.innerText.trim());
            if(variantTitle && containsNumber(titleText) && titleText.includes(parseInt(quantity))){
                const variantPrice = await productVariant.$('.ty-price-num');
                const priceText = await variantPrice.evaluate(node => node.innerText.trim());
                price = priceText + ' RON';
            }
        }

        console.log(`\x1b[32mPrice at ${store} for ${fragrance}: ${price}\x1b[0m`);
        return { fragrance, store, price, url: details.url };
    } catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}


const makeupFetch = async (page, store, details, fragrance, quantity) => {
    try{
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        let price = 'Price not found';

        const variantScroller = await page.$('.variants');
        if(variantScroller){
            const variantItems = await variantScroller.$$('.variant');
            for (let variantItem of variantItems){
                const variantWeight = await variantItem.$('span');
                const weightText = await variantWeight.evaluate(node => node.innerText.trim());
                if(weightText.includes(parseInt(quantity))){
                    const priceElement = await variantItem.evaluate(node => node.getAttribute('data-price'));
                    price = priceElement + ' RON';
                    break;
                }
            }
        }
        else{
            const wrap = await page.$('.product-item__price-wrap');
            const priceElement = await wrap.$(details.price_selector);
            const priceText = await priceElement.evaluate(node => node.innerText.trim());
            price = priceText + ' RON';
        }

        console.log(`\x1b[32mPrice at ${store} for ${fragrance}: ${price}\x1b[0m`);
        return { fragrance, store, price, url: details.url };

    } catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}


const brastyFetch = async (page, store, details, fragrance, quantity) => {
    try{
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        let price = 'Price not found';

        const priceContainer = await page.$(details.price_selector);
        const priceElement = await priceContainer.$('strong');
        const priceText = await priceElement.evaluate(node => node.innerText.trim());
        price = priceText;

        console.log(`\x1b[32mPrice at ${store} for ${fragrance}: ${price}\x1b[0m`);
        return { fragrance, store, price, url: details.url };
    } catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}


const obsentumFetch = async (page, store, details, fragrance, quantity) => {
    try{
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        let price = 'Price not found';

        const priceContainer = await page.waitForSelector(details.price_selector, { timeout: 60000 });
        const priceElement = await priceContainer.$('.cstm-price');
        const priceText = await priceElement.evaluate(node => node.innerText.trim());
        price = priceText;

        console.log(`\x1b[32mFetching from ${store}. for ${fragrance}: ${price}\x1b[0m`);
        return { fragrance, store, price, url: details.url };
    }
    catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}

const parfumuritimisoaraFetch = async (page, store, details, fragrance, quantity) => {
    try{
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        let price = 'Price not found';

        const products = await page.$('#product-matrix-body');
        if(!products){
            let response = await basicFetch(page, store, details, fragrance, quantity);
            return response;
        }
        else{
            const childElements = await products.$$(':scope > *');
            for (let childElement of childElements){
                const weightElement = await childElement.$('span');
                const weightText = await weightElement.evaluate(node => node.innerText.trim());

                const priceElement = await childElement.$(details.price_selector);
                const priceText = await priceElement.evaluate(node => node.innerText.trim());

                if(weightText.includes(parseInt(quantity))){
                    price = priceText;
                    break;
                }
            }

            console.log(`\x1b[32mFetching from ${store}. for ${fragrance}: ${price}\x1b[0m`);
            return { fragrance, store, price, url: details.url};
        }
    } catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}


const vivantisFetch = async (page, store, details, fragrance, quantity) => {
    try{
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        let price = 'Price not found';

        const weights = await page.$$('.font-size-sm.fw-bold')
        for (let i = 0; i < weights.length; i = i + 2){
            const weightElement = weights[i];
            const priceElement = weights[i + 1];
            const weightText = await weightElement.evaluate(node => node.innerText.trim());
            const priceText = await priceElement.evaluate(node => node.innerText.trim());

            if(weightText.includes(parseInt(quantity))){
                price = priceText;
                break;
            }
        }

        console.log(`\x1b[32mFetching from ${store}. for ${fragrance}: ${price}\x1b[0m`);
        return { fragrance, store, price, url: details.url };
    } catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}

const sephoraFetch = async (page, store, details, fragrance, quantity) => {
    try{
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        let price = 'Price not found';

        const variantItems = await page.$$('.variation-info.variation-info-perfume');
        for (let variantItem of variantItems){
            const weightElement = await variantItem.$('.variation-title > :first-child');
            const weightText = await weightElement.evaluate(node => node.innerText.trim());

            const priceElement = await variantItem.$(details.price_selector);
            const priceText = await priceElement.evaluate(node => {
                // Get the text content of the node but only include the text that's directly inside it
                return node.childNodes[0].nodeValue.trim();
            });
            
            if(weightText.includes(parseInt(quantity))){
                price = priceText;
                break;
            }

        }

        console.log(`\x1b[32mFetching from ${store}. for ${fragrance}: ${price}\x1b[0m`);
        return { fragrance, store, price, url: details.url };
    }
    catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}

export const fetchPrices = async () => {
    let browser;
    try {
        // Read the JSON file
        const data = await fs.readFile('fragrances.json', 'utf-8');
        const fragrances = JSON.parse(data);

        // Launch the browser
        browser = await puppeteer.launch({ headless: true, defaultViewport: null });
        
        const pageLimit = pLimit(10); // Set your desired concurrency limit

        const fetchPriceFromStore = async (store, details, fragrance, quantity) => {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            
            let fetchPromise;
            switch (store) {
                case 'sephora.ro':
                    fetchPromise = sephoraFetch(page, store, details, fragrance, quantity);
                    break;
                case 'douglas.ro':
                    fetchPromise = douglasFetch(page, store, details, fragrance, quantity);
                    break;
                case 'notino.ro':
                    fetchPromise = notinoFetch(page, store, details, fragrance, quantity);
                    break;
                case 'marionnaud.ro':
                    fetchPromise = marionnaudFetch(page, store, details, fragrance, quantity);
                    break;
                case 'hiris.ro':
                    fetchPromise = hirisFetch(page, store, details, fragrance, quantity);
                    break;
                case 'parfumu.ro':
                    fetchPromise = parfumuFetch(page, store, details, fragrance, quantity);
                    break;
                case 'makeup.ro':
                    fetchPromise = makeupFetch(page, store, details, fragrance, quantity);
                    break;
                case 'brasty.ro':
                    fetchPromise = brastyFetch(page, store, details, fragrance, quantity);
                    break;
                case 'obsentum.com':
                    fetchPromise = obsentumFetch(page, store, details, fragrance, quantity);
                    break;
                case 'parfumuri-timisoara.ro':
                    fetchPromise = parfumuritimisoaraFetch(page, store, details, fragrance, quantity);
                    break;
                case 'vivantis.ro':
                    fetchPromise = vivantisFetch(page, store, details, fragrance, quantity);
                    break;
                default:
                    fetchPromise = basicFetch(page, store, details, fragrance, quantity);
            }

            const result = await fetchPromise;
            await page.close();
            return result;
        };

        const promises = [];

        // Iterate through each fragrance
        for (const [fragrance, stores] of Object.entries(fragrances)) {
            const quantity = stores.quantity;
            console.log(`\x1b[33mFetching prices for: ${fragrance}\x1b[0m`);
            
            for (const [store, details] of Object.entries(stores)) {
                if (store === "quantity" || !details.url || !details.price_selector) continue;

                console.log(`\x1b[36mFetching from ${store}...\x1b[0m`);
                promises.push(pageLimit(() => fetchPriceFromStore(store, details, fragrance, quantity)));
            }
        }

        const results = await Promise.all(promises);
        fs.writeFile('results.json', JSON.stringify(results, null, 2));
        console.log(results);

    } catch (error) {
        console.error('Error reading JSON file or initializing Puppeteer:', error);
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing the browser:', closeError);
            }
        }
    }
};



const closeBrowserAndExit = async () => {
    if (browser) {
        try {
            console.log('Closing browser...');
            await browser.close();
        } catch (error) {
            console.error('Error closing the browser:', error);
        }
    }

    // Try to kill any child processes created by Puppeteer
    if (process.pid) {
        psTree(process.pid, (err, children) => {
            if (err) {
                console.error('Error retrieving child processes:', err);
            } else {
                children.forEach(child => {
                    try {
                        process.kill(child.PID, 'SIGTERM');
                    } catch (killErr) {
                        console.warn(`Could not terminate process ${child.PID}: ${killErr.message}`);
                    }
                });
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
};


// Register signal handlers for graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nCaught interrupt signal (SIGINT), shutting down gracefully...');
    await closeBrowserAndExit();
});

process.on('SIGTERM', async () => {
    console.log('Caught termination signal (SIGTERM), shutting down gracefully...');
    await closeBrowserAndExit();
});

process.on('SIGQUIT', async () => {
    console.log('Caught quit signal (SIGQUIT), shutting down gracefully...');
    await closeBrowserAndExit();
});
//------------------------------------------------

fetchPrices();
