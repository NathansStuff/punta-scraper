import puppeteer from 'puppeteer';
import {
    createHorseService,
    generateFilename,
    getHorseByStudbookIdService,
    updateHorseService,
} from 'src/features/horse/horseService';
import { Horse } from 'src/features/horse/types/Horse';
import { EOutcome } from 'src/features/report/EOutcome';
import { createReportService } from 'src/features/report/reportService';
import { Report } from 'src/features/report/reportType';

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
        const url = `https://www.studbook.org.au/Horse.aspx?hid=${id}`;

        // Navigate to the target page
        await page.goto(url);

        await page.screenshot({ path: generateFilename(url), fullPage: true });
        console.log('Screenshot taken and saved as example.png');

        // Check if the page has a server error
        const hasServerError = await checkForServerError(page);
        if (hasServerError) {
            console.log(`Server error encountered for horse ID: ${id}. Skipping...`);
            const report: Report = {
                event: 'Scraper',
                message: `Server error encountered for horse ID: ${id}. Skipping...`,
                url: `https://www.studbook.org.au/Horse.aspx?hid=${id}`,
                outcome: EOutcome.INVALID_ID,
                studbookId: id,
            };
            await createReportService(report);

            await delay(delayMs); // This adds the delay
            continue; // Move to the next ID
        }

        // Extract pedigree information
        const info = await horseInfo(page);

        // Save the extracted information
        await saveInfo(id, info);

        const report: Report = {
            event: 'Scraper',
            message: `Successfully scraped horse ID: ${id}`,
            url: `https://www.studbook.org.au/Horse.aspx?hid=${id}`,
            outcome: EOutcome.SUCCESS,
            studbookId: id,
        };
        await createReportService(report);

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
    const existingHorse = await getHorseByStudbookIdService(id);

    if (!existingHorse) {
        // Create new horse
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
        await createHorseService(horse);
        console.log('Saved Horse:', id);
        return;
    }

    // Update existing horse
    existingHorse.name = info.name;
    existingHorse.lifeNumber = info.lifeNumber;
    existingHorse.dateOfBirth = sanitizeDate(info.dateOfBirth);
    existingHorse.microchipNumber = info.microchipNumber;
    existingHorse.dnaTyped = info.dnaTyped;
    existingHorse.austId = info.austId;
    if (existingHorse.studbook) {
        existingHorse.studbook.lastScraped = new Date();
    } else {
        existingHorse.studbook = {
            id,
            firstScraped: new Date(),
            lastScraped: new Date(),
        };
    }
    existingHorse.pedigreeInfo = info.pedigreeTree;

    await updateHorseService(existingHorse._id.toString(), existingHorse);
    console.log('Updated Horse: ', id);
}
