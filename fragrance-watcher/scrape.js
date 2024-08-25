import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';

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
    } catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}

const sephoraFetch = async (page, store, details, fragrance, quantity) => {
    try {
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        let price = 'Price not found';
        let foundPrice = false;

        const cookieAccept = await page.$('#footer_tc_privacy_button_3');
        if (cookieAccept) {
            await cookieAccept.click();
        }

        // Check if there is a dropdown element
        const dropdownElement = await page.$('.variations-size-selected');
        if (dropdownElement) {
            // Toggle the dropdown to reveal all options
            await dropdownElement.click();
        }

        const parentModal = await page.$('.dialog-content.ui-dialog-content.ui-widget-content');  
        if (parentModal) {
            
            const variationElements = await parentModal.$$('.variation-title');
            for (const variationElement of variationElements) {

                const childrenData = await page.evaluate((parent) => {
                    const children = parent.children;
                    let result = [];
    
                    for (let child of children) {
                        result.push({
                            tagName: child.tagName,
                            classList: Array.from(child.classList).join(' '), // Convert class list to a space-separated string
                            id: child.id || 'null', // Get the ID or 'null' if not present
                            innerHTML: child.innerHTML.trim(), // Get the inner HTML for better formatting
                            innerText: child.innerText.trim(), // Get the inner text for better formatting
                        });
                    }
    
                    return result;
                }, variationElement);

                for (const childData of childrenData) {
                    
                    if(childData.innerText.includes(parseInt(quantity)) && childData.tagName === 'SPAN' && childData.classList === '') {
                        const priceElement = await variationElement.$(details.price_selector);
                        if (priceElement && !foundPrice) {
                            price = await priceElement.evaluate(node => {
                                let text = node.innerText.trim();
                                // Clean the text to remove newline and any text in parentheses (e.g., "\n(1)")
                                text = text.replace(/\s*\(.*?\)/g, ''); // Removes any text in parentheses including the preceding whitespace
                                text = text.replace(/[^0-9.,]/g, ''); // Removes non-numeric characters except ',' and '.'
                                
                                // Extract numbers up to the first ',' or '.'
                                const numbersOnly = text.match(/^\d+/);
                                return numbersOnly ? `${numbersOnly[0]} RON` : null; // Append 'RON' to the number
                            });
                            foundPrice = true;
                            break;   
                        }
                    }
                }

            }
        }
        console.log(`\x1b[32mPrice at ${store} for ${fragrance}: ${price}\x1b[0m`);
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

        console.log(`\x1b[32mPrice at ${store} for ${fragrance}: ${price}\x1b[0m`);

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
        browser = await puppeteer.launch({ headless: true, defaultViewport: null });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        

        // Iterate through each fragrance
        for (const [fragrance, stores] of Object.entries(fragrances)) {
            const quantity = stores.quantity; // Get the quantity for the current fragrance
            console.log(`\x1b[33mFetching prices for: ${fragrance}\x1b[0m`);
            for (const [store, details] of Object.entries(stores)) {
                if (store === "quantity") continue; // Skip the quantity key
                
                if (details.url && details.price_selector) {
                    console.log(`\x1b[36mFetching from ${store}...\x1b[0m`);
                    if (store !== 'sephora.ro' && store !== 'douglas.ro' 
                        && store !== 'notino.ro' && store !== 'marionnaud.ro'
                        && store != 'hiris.ro' && store != 'parfumu.ro' && store != 'makeup.ro') {
                        await basicFetch(page, store, details, fragrance, quantity);
                    } else if (store === 'sephora.ro') {
                        await sephoraFetch(page, store, details, fragrance, quantity);
                    } else if (store === 'douglas.ro') {
                        await douglasFetch(page, store, details, fragrance, quantity);
                    } else if (store === 'notino.ro'){
                        await notinoFetch(page, store, details, fragrance, quantity);
                    } else if (store === 'marionnaud.ro'){
                        await marionnaudFetch(page, store, details, fragrance, quantity);
                    } else if (store === 'hiris.ro'){
                        await hirisFetch(page, store, details, fragrance, quantity);
                    } else if (store === 'parfumu.ro'){
                        await parfumuFetch(page, store, details, fragrance, quantity);
                    } else if (store === 'makeup.ro'){
                        await makeupFetch(page, store, details, fragrance, quantity);
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
