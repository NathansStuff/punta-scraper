/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';
import { Page } from 'puppeteer';
import { generateFilename } from 'src/features/horse/horseService';
import { EState } from 'src/features/location/types/EState';
import { getBrowser } from 'src/lib/puppeteer';

import { deleteLocalFile, uploadToS3 } from '../s3';

export async function scrapeRacingAus(): Promise<void> {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000); // Increase navigation timeout to 60 seconds

    const date = new Date();
    const dateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

    const url = `https://www.racingaustralia.horse/Home.aspx?date=${dateString}`;
    await page.goto(url);
    console.log('Navigated to:', url);

    const screenshotPath = generateFilename(url);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const s3Key = `screenshots/${path.basename(screenshotPath)}`;
    await uploadToS3(screenshotPath, s3Key);
    deleteLocalFile(screenshotPath);

    // File to save the raw HTML
    const htmlFilePath = path.join(__dirname, 'rawPage.html');
    const rawHTML = await page.content(); // Get the raw HTML of the page
    fs.writeFileSync(htmlFilePath, rawHTML);

    const raceDays = await getRaceDays(page);
    console.log(raceDays, 'raceDays');
}

async function getRaceDays(page: Page): Promise<any> {
    // Define state columns mapping outside browser context
    const stateColumns = [
        EState.NSW,  // Column 1
        EState.VIC,  // Column 2
        EState.QLD,  // Column 3
        EState.WA,   // Column 4
        EState.SA,   // Column 5
        EState.TAS,  // Column 6
        EState.NT,   // Column 7
        EState.ACT   // Column 8
    ];

    const raceDays = await page.evaluate((states) => {
        const table = document.querySelector('table.full-calendar');
        if (!table) return null;

        const rows = Array.from(table.querySelectorAll('tr.rows'));

        return rows.map(row => {
            const dateCell = row.querySelector('td:first-child span')?.textContent?.trim();
            const raceMeetings = Array.from(row.querySelectorAll('td')).slice(1) // Skip date cell
                .map((cell, columnIndex) => {
                    const links = Array.from(cell.querySelectorAll('a'))
                        .map(link => ({
                            venue: link.textContent?.trim(),
                            url: link.getAttribute('href'),
                            state: states[columnIndex]
                        }))
                        .filter(link => link.venue && link.url);

                    return links;
                })
                .filter(meetings => meetings.length > 0);

            return {
                rawDate: dateCell,
                meetings: raceMeetings
            };
        });
    }, stateColumns);

    // Format the dates
    const formattedRaceDays = raceDays?.map(day => {
        // Extract date components from strings like "FRIDAY 01 NOV"
        const [dayName, dayNum, month] = day.rawDate?.split(' ') ?? [];
        const year = new Date().getFullYear();

        // Convert month abbreviation to month number (0-11)
        const months = {
            'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
            'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
        };

        const date = new Date(year, months[month as keyof typeof months], parseInt(dayNum));

        return {
            date,
            meetings: day.meetings
        };
    });

    // Log the first meeting of each day
    formattedRaceDays?.forEach(day => {
        console.log('\nDate:', day.date.toLocaleDateString());
        if (day.meetings[0] && day.meetings[0].length > 0) {
            console.log('First meeting:', JSON.stringify(day.meetings[0], null, 2));
        }
    });

    return formattedRaceDays;
}
