/* eslint-disable no-restricted-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';
import { Page } from 'puppeteer';
import { generateFilename } from 'src/features/horse/horseService';
import { EState } from 'src/features/location/types/EState';
import { getBrowser } from 'src/lib/puppeteer';

import { createLocationService,getLocationByNameAndStateService } from '../../location/locationService';
import { Location } from '../../location/types/Location';
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
    const stateColumns = [
        EState.NSW, EState.VIC, EState.QLD, EState.WA,
        EState.SA, EState.TAS, EState.NT, EState.ACT
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

    // Process race days and handle locations
    const formattedRaceDays = await Promise.all(raceDays?.map(async (day) => {
        const [dayName, dayNum, month] = day.rawDate?.split(' ') ?? [];
        const year = new Date().getFullYear();

        const months = {
            'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
            'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
        };

        const date = new Date(year, months[month as keyof typeof months], parseInt(dayNum));

        // Process each meeting to include location ID
        const processedMeetings = await Promise.all(
            day.meetings.map(async (stateGroup) => {
                return Promise.all(stateGroup.map(async (meeting) => {
                    // Check if location exists
                    let location = await getLocationByNameAndStateService(meeting.venue!, meeting.state!);

                    // If location doesn't exist, create it
                    if (!location) {
                        const newLocation: Location = {
                            name: meeting.venue ?? '',
                            state: meeting.state as EState
                        };
                        location = await createLocationService(newLocation);
                    }

                    return {
                        ...meeting,
                        locationId: location._id.toString()
                    };
                }));
            })
        );

        return {
            date,
            meetings: processedMeetings
        };
    }) ?? []);

    // Log the first meeting of each day
    formattedRaceDays?.forEach(day => {
        console.log('\nDate:', day.date.toLocaleDateString());
        if (day.meetings[0] && day.meetings[0].length > 0) {
            console.log('First meeting:', JSON.stringify(day.meetings[0], null, 2));
        }
    });

    return formattedRaceDays;
}
