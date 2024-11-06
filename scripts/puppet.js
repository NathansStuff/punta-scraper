const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    // Launch a new browser instance
    const browser = await puppeteer.launch();

    // Open a new page
    const page = await browser.newPage();

    // Go to the website
    const url = 'https://racingaustralia.horse/FreeFields/Results.aspx?Key=2024Nov05%2CNSW%2CDubbo'; // Replace with your target URL
    await page.goto(url, { waitUntil: 'load' });

    // Extract table content
    const tableHtml = await page.evaluate(() => {
        // Select all tables on the page
        const tables = document.querySelectorAll('table');
        // Convert tables NodeList to an array of HTML strings
        return Array.from(tables)
            .map((table) => table.outerHTML)
            .join('\n');
    });

    // Save extracted table HTML to a local file
    fs.writeFileSync('table_data.html', tableHtml, 'utf-8');

    // Close the browser
    await browser.close();

    console.log('Table data saved to table_data.html');
})();
