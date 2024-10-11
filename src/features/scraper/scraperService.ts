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
import { deleteLocalFile, uploadToS3 } from './s3';
import { checkForServerError, horseInfo, login, sanitizeDate } from './scraperUtils';

// At the top of the file, add this type declaration
type BrowserProgress = Array<{
    browser: number;
    currentId: number;
    endId: number;
    lastHorseTime: string;
    avgTimePerHorse: string;
    elapsedTime: string;
    remainingTime: string;
    estimatedFinish: string;
    progress: string;
}>;

// Declare the global variable
declare global {
    var browserProgress: BrowserProgress;
}

const delay = (ms: number): Promise<unknown> => new Promise((resolve) => setTimeout(resolve, ms));

export async function scraperService(
    startId: number,
    endId: number,
    delayMs: number = 2000,
    numBrowsers: number = 1
): Promise<void> {
    console.log(`Starting scraper with ${numBrowsers} browsers`);

    let currentId = startId;
    const scraperPromises = Array.from({ length: numBrowsers }, (_, index) =>
        scrapeRange(
            endId,
            delayMs,
            index,
            () => currentId++,
            () => startId,
            numBrowsers
        )
    );

    await Promise.all(scraperPromises);

    console.log('All scraping processes completed');
}

async function scrapeRange(
    endId: number,
    delayMs: number,
    browserIndex: number,
    getNextId: () => number,
    getStartId: () => number,
    numBrowsers: number
): Promise<void> {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 800,
            height: 600,
        },
        args: ['--window-size=800,600', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000); // Increase navigation timeout to 60 seconds
    await login(page);

    const startTime = Date.now();
    let horsesScraped = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const id = getNextId();
        if (id > endId) break;

        horsesScraped++;
        console.log(`Browser ${browserIndex + 1}: Scraping horse ID:`, id);
        const url = `https://www.studbook.org.au/Horse.aspx?hid=${id}`;

        const horseStartTime = Date.now();

        let retries = 3;
        let success = false;

        while (retries > 0 && !success) {
            try {
                await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
                success = true;
            } catch (error) {
                console.error(`Navigation failed for horse ID ${id}. Retrying... (${retries} attempts left)`);
                retries--;
                if (retries === 0) {
                    console.error(`Failed to navigate to horse ID ${id} after 3 attempts. Skipping...`);
                    const report: Report = {
                        event: 'Scraper',
                        message: `Navigation failed for horse ID: ${id}. Skipping...`,
                        url: url,
                        outcome: EOutcome.NAVIGATION_ERROR,
                        studbookId: id,
                    };
                    await createReportService(report);
                    continue;
                }
                await delay(5000); // Wait 5 seconds before retrying
            }
        }

        if (!success) continue;

        const screenshotPath = generateFilename(url);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        const s3Key = `screenshots/${path.basename(screenshotPath)}`;
        await uploadToS3(screenshotPath, s3Key);
        deleteLocalFile(screenshotPath);

        const hasServerError = await checkForServerError(page);
        if (hasServerError) {
            const report: Report = {
                event: 'Scraper',
                message: `Server error encountered for horse ID: ${id}. Skipping...`,
                url: url,
                outcome: EOutcome.INVALID_ID,
                studbookId: id,
            };
            await createReportService(report);
            console.log(`Browser ${browserIndex + 1}: Server error encountered for horse ID:`, id);
            await delay(delayMs);
            continue;
        }

        const info = await horseInfo(page, id.toString());
        await saveInfo(id, info);

        const report: Report = {
            event: 'Scraper',
            message: `Successfully scraped horse ID: ${id}`,
            url: url,
            outcome: EOutcome.SUCCESS,
            studbookId: id,
        };
        await createReportService(report);

        const horseEndTime = Date.now();
        const horseTimeTaken = (horseEndTime - horseStartTime) / 1000; // in seconds
        const elapsedTime = (horseEndTime - startTime) / 1000; // in seconds
        const elapsedHours = Math.floor(elapsedTime / 3600);
        const elapsedMinutes = Math.floor((elapsedTime % 3600) / 60);

        // Calculate progress percentage
        const totalHorses = endId - getStartId() + 1;
        const percentage = ((horsesScraped / (totalHorses / numBrowsers)) * 100).toFixed(2);

        // Estimate remaining time, accounting for multiple browsers
        const averageTimePerHorse = elapsedTime / horsesScraped;
        const remainingHorses = Math.ceil((totalHorses - (id - getStartId() + 1)) / numBrowsers);
        const estimatedRemainingTime = averageTimePerHorse * remainingHorses;
        const remainingHours = Math.floor(estimatedRemainingTime / 3600);
        const remainingMinutes = Math.floor((estimatedRemainingTime % 3600) / 60);

        // Calculate estimated finish time
        const estimatedFinishTime = new Date(horseEndTime + estimatedRemainingTime * 1000);
        const estimatedFinishTimeString = estimatedFinishTime.toLocaleString();

        updateAndPrintProgress(
            browserIndex,
            id,
            endId,
            horseTimeTaken,
            averageTimePerHorse,
            elapsedTime,
            estimatedRemainingTime,
            estimatedFinishTime,
            percentage,
            numBrowsers
        );

        await delay(delayMs);
    }

    const endTime = Date.now();
    const totalTimeTaken = (endTime - startTime) / 1000;
    console.log(`Browser ${browserIndex + 1}: All horses scraped. Total time taken: ${totalTimeTaken / 60} minutes`);

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

function updateAndPrintProgress(
    browserIndex: number,
    currentId: number,
    endId: number,
    horseTimeTaken: number,
    averageTimePerHorse: number,
    elapsedTime: number,
    estimatedRemainingTime: number,
    estimatedFinishTime: Date,
    percentage: string,
    numBrowsers: number
): void {
    const elapsedHours = Math.floor(elapsedTime / 3600);
    const elapsedMinutes = Math.floor((elapsedTime % 3600) / 60);
    const remainingHours = Math.floor(estimatedRemainingTime / 3600);
    const remainingMinutes = Math.floor((estimatedRemainingTime % 3600) / 60);

    if (!global.browserProgress) {
        global.browserProgress = new Array(numBrowsers).fill(null).map((_, index) => ({
            browser: index + 1,
            currentId: 0,
            endId: endId,
            lastHorseTime: '0s',
            avgTimePerHorse: '0s',
            elapsedTime: '0h 0m',
            remainingTime: 'N/A',
            estimatedFinish: 'N/A',
            progress: '0%',
        }));
    }

    global.browserProgress[browserIndex] = {
        browser: browserIndex + 1,
        currentId: currentId,
        endId: endId,
        lastHorseTime: horseTimeTaken.toFixed(2) + 's',
        avgTimePerHorse: averageTimePerHorse.toFixed(2) + 's',
        elapsedTime: `${elapsedHours}h ${elapsedMinutes}m`,
        remainingTime: `${remainingHours}h ${remainingMinutes}m`,
        estimatedFinish: estimatedFinishTime.toLocaleString(),
        progress: percentage + '%',
    };

    // Clear console and print the table
    console.clear();
    console.table(global.browserProgress);

    // Print overall progress
    const totalProgress =
        global.browserProgress.reduce((sum, browser) => sum + parseFloat(browser.progress), 0) / numBrowsers;
    const overallEstimatedFinish = global.browserProgress.reduce((latest, browser) => {
        const current = new Date(browser.estimatedFinish);
        return isNaN(current.getTime()) ? latest : current > latest ? current : latest;
    }, new Date(0));

    console.log(`\nOverall Progress: ${totalProgress.toFixed(2)}%`);
    console.log(`Estimated Overall Finish: ${overallEstimatedFinish.toLocaleString()}`);
}
