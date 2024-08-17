const puppeteer = require('puppeteer');

const sites = {
    "marionnaud.ro": {
        "url": "https://www.marionnaud.ro/yves-saint-laurent/myslf/myslf-apa-de-parfum-reincarcabil/p/BP_83143?varSel=83146",
        "price_selector": ".formatted-price__decimal"
    },
    "simplestore.ro": {
        "url": "https://www.simplestore.ro/apa-de-parfum-yves-saint-laurent-my-slf-edp-rechargable-150-ml",
        "price_selector": ".priceprodnormal .pret-normal-tva .pretpagprod"
    },
    "depozituldecosmetice.ro": {
        "url": "https://depozituldecosmetice.ro/yves-saint-laurent-myslf-refill-apa-de-parfum-rezerva-150ml.html",
        "price_selector": ".price"
    }
};

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (const [site, { url, price_selector }] of Object.entries(sites)) {
        try {
            console.log(`Scraping ${site}...`);
            await page.goto(url, { waitUntil: 'domcontentloaded' });

            // Extract the price using the provided selector
            const price = await page.$eval(price_selector, el => el.textContent.trim());
            console.log(`Price on ${site}: ${price}`);
        } catch (error) {
            console.error(`Failed to scrape ${site}: ${error.message}`);
        }
    }

    await browser.close();
})();
