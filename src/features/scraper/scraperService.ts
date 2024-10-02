import puppeteer from 'puppeteer';
import { createHorseService } from 'src/features/horse/horseService';
import { Horse } from 'src/features/horse/types/Horse';

import { HorseInfo } from './types/HorseInfo';
import { loadCookies } from './utils/utils';
import { checkForServerError, horseInfo, login, sanitizeDate } from './scraperUtils';

const delay = (ms: number): Promise<unknown> => new Promise((resolve) => setTimeout(resolve, ms));

export async function scraperService(startId: number, endId: number, delayMs: number = 2000): Promise<void> {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Try to load cookies; if cookies exist, go straight to the horse page
    const cookiesLoaded = await loadCookies(page);

    if (!cookiesLoaded) {
        // No cookies; go to the login page
        await login(page);
    } else {
        console.log('Cookies found. Skipping login and going straight to horse pages...');
    }

    // Loop through the IDs sequentially
    for (let id = startId; id <= endId; id++) {
        console.log(`Scraping horse with id: ${id}`);

        // Navigate to the target page
        await page.goto(`https://www.studbook.org.au/Horse.aspx?hid=${id}`);

        // Check if the page has a server error
        const hasServerError = await checkForServerError(page);
        if (hasServerError) {
            console.log(`Server error encountered for horse ID: ${id}. Skipping...`);
            await delay(delayMs); // This adds the delay
            continue; // Move to the next ID
        }

        // Extract pedigree information
        const info = await horseInfo(page);

        // Save the extracted information
        await saveInfo(id, info);

        // Use the custom delay before moving to the next page
        console.log(`Waiting for ${delayMs} milliseconds before the next request...`);
        await delay(delayMs); // This adds the delay
    }

    console.log('Finished scraping horses');

    await browser.close();
}

async function saveInfo(id: number, info: HorseInfo): Promise<void> {
    if (!info.name) {
        console.error('No name found');
        return;
    }
    console.log('saving horse:', info);

    const horse: Horse = {
        name: info.name,
        lifeNumber: info.lifeNumber,
        dateOfBirth: sanitizeDate(info.dateOfBirth),
        microchipNumber: info.microchipNumber,
        dnaTyped: info.dnaTyped,
        austId: info.austId,
        studbook: {
            id,
            firstScraped: new Date(),
            lastScraped: new Date(),
        },
        pedigreeInfo: info.pedigreeTree,
    };
    const savedHorse = await createHorseService(horse);
    console.log('Saved Horse:', savedHorse);
}
