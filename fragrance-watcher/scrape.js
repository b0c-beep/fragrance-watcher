import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';

// Apply stealth plugin to Puppeteer
puppeteer.use(StealthPlugin());


const basicFetch = async (page, store, details, fragrance, quantity) => {
    try {
        await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                        
        // Fetch the price using the selector
        let price = await page.evaluate((selector) => {
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
        console.log(`Price at ${store} for ${fragrance}: ${price}`);
    } catch (error) {
        console.error(`Error fetching price from ${store} for ${fragrance}:`, error);
    }
}

const douglasFetch = async (page, store, details, fragrance, quantity) => {
    await page.goto(details.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    let price = 'Price not found';

    const highlightElement = async (selector) => {
        await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.border = '2px solid red';
            }
        }, selector);
    };


    const parentModal = await page.$('.product-detail-buy');

    if(parentModal) {
        
        const variationElements = await parentModal.$$('.d-flex.flex-row.justify-content-between');

        for(let variationELement of variationElements){

            const cookieAccept = await page.$('[data-testid="uc-accept-all-button"]');
            
            if(cookieAccept){console.log("found cookie button");}

            //it stops at the line below
            const variationQuantity = await variationELement.$('.price-unit-content').innerText;
            
            if (cookieAccept) {
                await cookieAccept.click();
                console.log('Cookie accepted');
            }

            if(variationQuantity.includes(parseInt(quantity))){
                const priceElement = await variationELement.$(details.price_selector);
                if(priceElement){
                    console.log('found');
                }
            }
        }
    }
    //console.log(`Price at ${store} for ${fragrance}: ${price}`);
}

const fetchPrices = async () => {
    try {
        // Read the JSON file
        const data = await fs.readFile('fragrances.json', 'utf-8');
        const fragrances = JSON.parse(data);
        
        // Launch the browser
        const browser = await puppeteer.launch({ headless: false, defaultViewport: null, slowMo: 200 });
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
    }
};

fetchPrices();
