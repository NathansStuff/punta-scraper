import path from 'path';
import puppeteer from 'puppeteer';
import {
    createHorseService,
    generateFilename,
    getHorseByStudbookIdService,
    updateHorseService,
} from 'src/features/horse/horseService';
import { ESex } from 'src/features/horse/types/ESex';
import { Horse } from 'src/features/horse/types/Horse';
import { EOutcome } from 'src/features/report/EOutcome';
import { createReportService } from 'src/features/report/reportService';
import { Report } from 'src/features/report/reportType';
import { ELivingStatus } from 'src/types/ELivingStatus';

import { HorseInfo } from './types/HorseInfo';
import { saveRawHTML } from './utils/utils';
import { deleteLocalFile, uploadToS3 } from './s3';
import { checkForServerError, horseInfo, login, sanitizeDate } from './scraperUtils';

const delay = (ms: number): Promise<unknown> => new Promise((resolve) => setTimeout(resolve, ms));

export async function scraperService(startId: number, endId: number, delayMs: number = 2000): Promise<void> {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 800, // Set your desired width
            height: 600, // Set your desired height
        },
        args: [
            '--window-size=800,600', // Set the window size for the browser
        ],
    });
    const page = await browser.newPage();
    await login(page);

    // Loop through the IDs sequentially
    for (let id = startId; id <= endId; id++) {
        console.log(`Scraping horse with id: ${id}`);
        const url = `https://www.studbook.org.au/Horse.aspx?hid=${id}`;

        // Navigate to the target page
        await page.goto(url);

        // Generate the filename for the screenshot
        const screenshotPath = generateFilename(url);
        console.log('Generating screenshot:', screenshotPath);

        // Take a screenshot
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log('Screenshot taken:', screenshotPath);

        // Upload the screenshot to S3
        const s3Key = `screenshots/${path.basename(screenshotPath)}`; // Define S3 key (path in bucket)
        await uploadToS3(screenshotPath, s3Key);

        // Delete the screenshot locally after upload
        deleteLocalFile(screenshotPath);

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
        const info = await horseInfo(page, id.toString());

        saveRawHTML(page);

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
    let gender: ESex | undefined;
    if (info.gender === 'mare') {
        gender = ESex.FEMALE;
    } else if (info.gender === 'stallion') {
        gender = ESex.MALE;
    }
    let deceasedDate: Date | undefined;
    if (info.deceased) {
        try {
            const [day, month, year] = info.deceased.split('/');
            deceasedDate = new Date(`${year}-${month}-${day}`); // Convert to YYYY-MM-DD format
        } catch (e) {
            console.error('Error parsing deceased date', e);
        }
    }
    let status: ELivingStatus | undefined;
    if (deceasedDate) {
        status = ELivingStatus.DECEASED;
    }

    if (!existingHorse) {
        // Create new horse
        const horse: Horse = {
            name: info.name,
            status,
            deceasedDate,
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
            sex: gender,
            color: info.color,
            family: info.family,
            foalRef: info.foalRef,
            taproot: info.taprootInfo,
            bredBy: info.bredBy,
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
    existingHorse.sex = gender;
    existingHorse.deceasedDate = deceasedDate;
    existingHorse.status = status;
    existingHorse.foalRef = info.foalRef;
    existingHorse.color = info.color;
    existingHorse.bredBy = info.bredBy;
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
    existingHorse.family = info.family;
    existingHorse.taproot = info.taprootInfo;

    await updateHorseService(existingHorse._id.toString(), existingHorse);
    console.log('Updated Horse: ', id);
}
