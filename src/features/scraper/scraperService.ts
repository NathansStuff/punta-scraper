import puppeteer from 'puppeteer';
import { createHorseService } from 'src/features/horse/horseService';
import { Horse } from 'src/features/horse/types/Horse';

import { HorseInfo } from './types/HorseInfo';
import { loadCookies, saveRawHTML } from './utils/utils';
import { horseInfo, login } from './scraperUtils';

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
    const id = 1025161;
    await page.goto(`https://www.studbook.org.au/Horse.aspx?hid=${id}`);

    // Save the raw HTML for later analysis
    await saveRawHTML(page);

    // Extract pedigree information
    const info = await horseInfo(page);

    // Save the extracted information
    await saveInfo(id, info);

    await browser.close();
}

async function saveInfo(id: number, info: HorseInfo): Promise<void> {
    if (!info.name) {
        console.error('No name found');
        return;
    }

    const horse: Horse = {
        name: info.name,
        lifeNumber: info.lifeNumber,
        dateOfBirth: new Date(info.dateOfBirth || ''),
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
