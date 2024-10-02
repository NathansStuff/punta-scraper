import puppeteer, { Page } from 'puppeteer';

import { loadCookies, saveCookies, saveRawHTML } from './utils/utils';

async function login(page: Page): Promise<void> {
    // Navigate to the login page
    await page.goto('https://www.studbook.org.au/Default.aspx');

    // Wait for the login form to appear and perform login
    if (await page.$('input[name="txtUserId"]')) {
        await page.type('input[name="txtUserId"]', '763168');
        await page.type('input[name="txtPassword"]', 'XQRLFG');
        await page.click('input[name="btnLogin"]');
        await page.waitForNavigation();

        // Save cookies after logging in
        await saveCookies(page);
    } else {
        console.error('Login form not found');
    }
}

interface PedigreeItem {
    text: string;
    link: string;
    index: number;
}

export async function extractPedigreeInfo(page: Page): Promise<PedigreeItem[]> {
    console.log('Extracting Pedigree Info...');

    // Use page.evaluate to run this code in the browser context
    const extractedItems: PedigreeItem[] = await page.evaluate(() => {
        const items: PedigreeItem[] = [];

        // Get all elements with the class 'PedigreeItem'
        const pedigreeItems = document.querySelectorAll<HTMLAnchorElement>('a.PedigreeItem');

        // Extract the text, href, and index for each item
        pedigreeItems.forEach((pedigreeItem, i) => {
            items.push({
                text: pedigreeItem.innerText, // Extract the inner text
                link: pedigreeItem.href, // Extract the href (link)
                index: i, // Index of the item
            });
        });

        return items; // Return the extracted information
    });
    return extractedItems;
}

async function horseInfo(page: Page): Promise<any> {
    const items = await page.evaluate(() => {
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

    return items;
}

export async function scraperService(): Promise<void> {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Try to load cookies; if cookies exist, go straight to the horse page
    const cookiesLoaded = await loadCookies(page);

    if (!cookiesLoaded) {
        // No cookies; go to the login page
        await login(page);
    } else {
        console.log('Cookies found. Skipping login and going straight to horse page...');
    }

    // Navigate to the target page
    await page.goto('https://www.studbook.org.au/horse.aspx?hid=1025161');

    // Save the raw HTML for later analysis
    await saveRawHTML(page);

    // Extract pedigree information
    const pedigreeInfo = await extractPedigreeInfo(page);
    const pedigreeTree = mapPedigreeTree(pedigreeInfo);
    console.log('Pedigree Tree:', pedigreeTree);
    console.log(pedigreeTree.length);

    // Log the extracted information
    const info = await horseInfo(page);
    console.log('Extracted Horse Info:', info);

    const horseName = await page.evaluate(() => {
        const element = document.querySelector('td.HeaderBlockNasuy') as HTMLElement;
        return element ? element.innerText.trim() : null;
    });

    console.log('Horse Name:', horseName);

    await browser.close();
}

function mapPedigreeTree(pedigreeItems: PedigreeItem[]) {
    return [
        {
            horse: {
                name: pedigreeItems[0].text,
                link: pedigreeItems[0].link,
            },
            father: {
                name: pedigreeItems[1].text,
                link: pedigreeItems[1].link,
            },
            mother: {
                name: pedigreeItems[2].text,
                link: pedigreeItems[2].link,
            },
        },
        {
            horse: {
                name: pedigreeItems[3].text,
                link: pedigreeItems[3].link,
            },
            father: {
                name: pedigreeItems[0].text,
                link: pedigreeItems[0].link,
            },
            mother: {
                name: pedigreeItems[4].text,
                link: pedigreeItems[4].link,
            },
        },
        {
            horse: {
                name: pedigreeItems[4].text,
                link: pedigreeItems[4].link,
            },
            father: {
                name: pedigreeItems[5].text,
                link: pedigreeItems[5].link,
            },
            mother: {
                name: pedigreeItems[6].text,
                link: pedigreeItems[6].link,
            },
        },
        {
            horse: {
                name: pedigreeItems[7].text,
                link: pedigreeItems[7].link,
            },
            father: {
                name: pedigreeItems[3].text,
                link: pedigreeItems[3].link,
            },
            mother: {
                name: pedigreeItems[11].text,
                link: pedigreeItems[11].link,
            },
        },
        {
            horse: {
                name: pedigreeItems[11].text,
                link: pedigreeItems[11].link,
            },
            father: {
                name: pedigreeItems[8].text,
                link: pedigreeItems[8].link,
            },
            mother: {
                name: pedigreeItems[12].text,
                link: pedigreeItems[12].link,
            },
        },
        {
            horse: {
                name: pedigreeItems[8].text,
                link: pedigreeItems[8].link,
            },
            father: {
                name: pedigreeItems[9].text,
                link: pedigreeItems[9].link,
            },
            mother: {
                name: pedigreeItems[10].text,
                link: pedigreeItems[10].link,
            },
        },
        {
            horse: {
                name: pedigreeItems[12].text,
                link: pedigreeItems[12].link,
            },
            father: {
                name: pedigreeItems[13].text,
                link: pedigreeItems[13].link,
            },
            mother: {
                name: pedigreeItems[14].text,
                link: pedigreeItems[14].link,
            },
        },
    ];
}
