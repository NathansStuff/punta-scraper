import fs from 'fs';
import path from 'path';
import puppeteer, { Page } from 'puppeteer';

// File to save cookies
const cookiesFilePath = path.join(__dirname, 'cookies.json');
// File to save the raw HTML
const htmlFilePath = path.join(__dirname, 'rawPage.html');

// Function to save cookies
async function saveCookies(page: Page) {
    const cookies = await page.cookies();
    fs.writeFileSync(cookiesFilePath, JSON.stringify(cookies, null, 2));
    console.log('Cookies saved.');
}

// Function to load cookies
async function loadCookies(page: Page) {
    if (fs.existsSync(cookiesFilePath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiesFilePath, 'utf-8'));
        await page.setCookie(...cookies);
        console.log('Cookies loaded.');
        return true; // Return true if cookies exist
    }
    return false; // Return false if no cookies
}

// Function to save the raw HTML of the page
async function saveRawHTML(page: Page) {
    const rawHTML = await page.content(); // Get the raw HTML of the page
    fs.writeFileSync(htmlFilePath, rawHTML);
    console.log(`Raw HTML saved to ${htmlFilePath}`);
}

export async function scraperService() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Try to load cookies; if cookies exist, go straight to the horse page
    const cookiesLoaded = await loadCookies(page);

    if (!cookiesLoaded) {
        // No cookies; go to the login page
        console.log('No cookies found. Navigating to login page...');
        await page.goto('https://www.studbook.org.au/Default.aspx');

        // Wait for the login form to appear and log in
        if (await page.$('input[name="txtUserId"]')) {
            console.log('Logging in...');
            await page.type('input[name="txtUserId"]', '763168');
            await page.type('input[name="txtPassword"]', 'XQRLFG');
            await page.click('input[name="btnLogin"]');
            await page.waitForNavigation();

            // Save cookies after logging in
            await saveCookies(page);
        }
    } else {
        console.log('Cookies found. Skipping login and going straight to horse page...');
    }

    // Navigate to the target page
    await page.goto('https://www.studbook.org.au/horse.aspx?hid=1025161&pagetype=PEDIGREE');

    // Save the raw HTML for later analysis
    await saveRawHTML(page);

    // Extract pedigree information
    const extractPedigreeInfo = async (page: Page) => {
        console.log('Extracting Pedigree Info...');

        const response = await page.evaluate(() => {
            const pedigree = {};
            const debugInfo = [];
            const extractedItems: any[] = [];

            // Get all PedigreeItem elements
            const pedigreeItems = document.querySelectorAll('a.PedigreeItem');
            debugInfo.push(`Found ${pedigreeItems.length} Pedigree Items`);
            debugInfo.push(`Item 0: ${pedigreeItems[0].textContent}`);

            // Log every pedigree item text and link for debugging
            pedigreeItems.forEach((pedigreeItem: any, i) => {
                debugInfo.push(`${i} -${pedigreeItem.textContent} - ${pedigreeItem.href}`);
            });

            function mapIndex(i: number) {
                switch (i) {
                    case 0:
                        return 'fathers father';
                    case 1:
                        return 'fathers father father';
                    case 2:
                        return 'fathers father mother';
                    case 3:
                        return 'father';
                    case 4:
                        return 'fathers mother';
                    case 5:
                        return 'fathers mother father';
                    case 6:
                        return 'fathers mother mother';
                    case 7:
                        return 'currentHorse';
                    case 8:
                        return 'mother';
                    case 9:
                        return 'mothers father';
                    case 10:
                        return 'mothers father father';
                    case 11:
                        return 'mothers father mother';
                    case 12:
                        return 'mothers mother';
                    case 13:
                        return 'mothers mother father';
                    case 14:
                        return 'mothers mother mother';

                    default:
                        return 'unknown';
                }
            }

            // Extract all pedigree items
            pedigreeItems.forEach((pedigreeItem, i) => {
                extractedItems.push({
                    text: (pedigreeItem as HTMLAnchorElement).innerText,
                    link: (pedigreeItem as HTMLAnchorElement).href,
                    relationship: mapIndex(i),
                    index: i,
                });
            });

            return extractedItems; // Return debug and extracted info
        });

        return response;
    };

    const pedigreeInfo = await extractPedigreeInfo(page);
    console.log('Pedigree Info:', pedigreeInfo);

    const horseInfo = await page.evaluate(() => {
        const info: any = {};

        // Get all `td` elements
        const tdElements = document.querySelectorAll('td');

        tdElements.forEach((td) => {
            const text = td.innerText.toLowerCase();

            // Find 'life number:'
            if (text.includes('life number:')) {
                info.lifeNumber = text.replace('life number:', '').trim();
            }

            // Find 'date of birth:'
            if (text.includes('date of birth:')) {
                info.dateOfBirth = text.replace('date of birth:', '').trim();
            }

            // Find 'microchip number'
            if (text.includes('microchip number:')) {
                info.microchipNumber = text.replace('microchip number:', '').trim();
            }

            // Find 'dna typed'
            if (text.includes('dna typed:')) {
                info.dnaTyped = text.replace('dna typed:', '').trim();
            }
        });

        return info;
    });

    // Log the extracted information
    console.log('Extracted Horse Info:', horseInfo);

    const horseName = await page.evaluate(() => {
        const element = document.querySelector('td.HeaderBlockNasuy') as HTMLElement;
        return element ? element.innerText.trim() : null;
    });

    console.log('Horse Name:', horseName);

    await browser.close();
}
