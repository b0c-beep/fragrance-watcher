import pupeteer from 'puppeteer';

const url = "https://www.simplestore.ro/apa-de-parfum-yves-saint-laurent-my-slf-edp-rechargable-150-ml";

const fetchPrice = async () => {    
    const browser = await pupeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    //await page.waitForSelector(price_selector);
    const price = await page.evaluate(() => {
        const priceElement = document.querySelector('.priceprodnormal');
        return priceElement.innerText;
    });
    await browser.close();
    console.log(price);
}

fetchPrice();