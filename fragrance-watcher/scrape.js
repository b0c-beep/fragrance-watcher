import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import process from 'process';
import psTree from 'ps-tree';

// Apply stealth plugin to Puppeteer
puppeteer.use(StealthPlugin());

let browser;

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
    try{
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        let price = 'Price not found';

        const buttons = await page.$$eval('button', elements => elements.map(button => ({innerText: button.innerText, element: button})));
        console.log(buttons);

        //console.log(buttons.length);

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
        browser = await puppeteer.launch({ headless: false, defaultViewport: null, slowMo: 200 });
        const page = await browser.newPage();

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
                        && store !== 'parfumuri-timisoara.ro') {

                        //await basicFetch(page, store, details, fragrance, quantity);
                    } else if (store === 'sephora.ro') {
                        //await sephoraFetch(page, store, details, fragrance, quantity);
                    }else if (store === 'douglas.ro') {
                        await douglasFetch(page, store, details, fragrance, quantity);
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
