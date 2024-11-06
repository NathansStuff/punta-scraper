/* eslint-disable simple-import-sort/imports */
/* eslint-disable no-restricted-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';
import { Page } from 'puppeteer';
import { generateFilename } from 'src/features/horse/horseService';
import { EState } from 'src/features/location/types/EState';
import { createRaceDayService } from 'src/features/raceDay/raceDayService';
import { getRaceDayByLocationAndDateService } from 'src/features/raceDay/raceDayService';
import { RaceDay } from 'src/features/raceDay/types/RaceDay';
import { getBrowser } from 'src/lib/puppeteer';

import { createLocationService, getLocationByNameAndStateService } from '../../location/locationService';
import { Location } from '../../location/types/Location';
import { deleteLocalFile, uploadToS3 } from '../s3';
import { EPerson } from 'src/features/person/EPerson';
import { PersonModel } from 'src/features/person/personModel';
import { connectMongo } from 'src/middleware/mongoDbConnect';

export async function scrapeRacingAusHome(): Promise<void> {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);

    // Get today and next 5 weeks
    const dates = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i * 7); // Increment by weeks
        return date;
    });

    for (const date of dates) {
        const dateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        const url = `https://www.racingaustralia.horse/Home.aspx?date=${dateString}`;

        console.log(`Scraping races for ${dateString} (Week ${dates.indexOf(date)})`);
        await page.goto(url);

        const screenshotPath = generateFilename(url);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        const s3Key = `screenshots/${path.basename(screenshotPath)}`;
        await uploadToS3(screenshotPath, s3Key);
        deleteLocalFile(screenshotPath);

        // Save raw HTML
        // const htmlFilePath = path.join(__dirname, `rawPage-${dateString.replace(/\//g, '-')}.html`);
        // const rawHTML = await page.content();
        // fs.writeFileSync(htmlFilePath, rawHTML);

        await getRaceDays(page);
    }

    await browser.close();
}

async function getRaceDays(page: Page): Promise<any> {
    const stateColumns = [EState.NSW, EState.VIC, EState.QLD, EState.WA, EState.SA, EState.TAS, EState.NT, EState.ACT];

    const raceDays = await page.evaluate((states) => {
        const table = document.querySelector('table.full-calendar');
        if (!table) return null;

        const rows = Array.from(table.querySelectorAll('tr.rows'));

        return rows.map((row) => {
            const dateCell = row.querySelector('td:first-child span')?.textContent?.trim();
            const raceMeetings = Array.from(row.querySelectorAll('td'))
                .slice(1) // Skip date cell
                .map((cell, columnIndex) => {
                    const links = Array.from(cell.querySelectorAll('a'))
                        .map((link) => ({
                            venue: link.textContent?.trim(),
                            url: link.getAttribute('href'),
                            state: states[columnIndex],
                        }))
                        .filter((link) => link.venue && link.url);

                    return links;
                })
                .filter((meetings) => meetings.length > 0);

            return {
                rawDate: dateCell,
                meetings: raceMeetings,
            };
        });
    }, stateColumns);

    // Process race days and handle locations
    const formattedRaceDays = await Promise.all(
        raceDays?.map(async (day) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [dayName, dayNum, month] = day.rawDate?.split(' ') ?? [];
            const year = new Date().getFullYear();

            const months = {
                JAN: 0,
                FEB: 1,
                MAR: 2,
                APR: 3,
                MAY: 4,
                JUN: 5,
                JUL: 6,
                AUG: 7,
                SEP: 8,
                OCT: 9,
                NOV: 10,
                DEC: 11,
            };

            const date = new Date(year, months[month as keyof typeof months], parseInt(dayNum));

            // Process each meeting to include location ID
            const processedMeetings = await Promise.all(
                day.meetings.map(async (stateGroup) => {
                    return Promise.all(
                        stateGroup.map(async (meeting) => {
                            // Check if location exists
                            let location = await getLocationByNameAndStateService(meeting.venue!, meeting.state!);

                            // If location doesn't exist, create it
                            if (!location) {
                                const newLocation: Location = {
                                    name: meeting.venue ?? '',
                                    state: meeting.state as EState,
                                };
                                location = await createLocationService(newLocation);
                            }

                            return {
                                ...meeting,
                                locationId: location._id.toString(),
                            };
                        })
                    );
                })
            );

            return {
                date,
                meetings: processedMeetings,
            };
        }) ?? []
    );

    // Log the first meeting of each day
    let count = 0;
    formattedRaceDays?.forEach((day) => {
        day.meetings.forEach((meetingGroup) => {
            meetingGroup.forEach(async (meeting) => {
                count++;
                const raceDay: RaceDay = {
                    date: day.date,
                    ...meeting,
                    urlExtension: meeting.url?.split('/').pop() ?? '',
                };

                const existingRaceDay = await getRaceDayByLocationAndDateService(raceDay.locationId, raceDay.date);
                if (!existingRaceDay) {
                    await createRaceDayService(raceDay);
                }
            });
        });
    });
    console.log(count, 'race days created');

    return formattedRaceDays;
}
export async function scrapeRacingAusRaceDay(urlExtension: string): Promise<void> {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);

    const url = `https://www.racingaustralia.horse/FreeFields/${urlExtension}`;

    console.log(`Scraping races for ${url}`);
    await page.goto(url);

    const screenshotPath = generateFilename(url);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    // const s3Key = `screenshots/${path.basename(screenshotPath)}`;
    // await uploadToS3(screenshotPath, s3Key);
    // deleteLocalFile(screenshotPath);
    // Save raw HTML
    const htmlFilePath = path.join(__dirname, `rawPage.html`);
    const rawHTML = await page.content();
    fs.writeFileSync(htmlFilePath, rawHTML);

    await page
        .waitForSelector('table.race-title', { timeout: 5000 })
        .catch(() => console.log('Timeout waiting for race-title table'));

    const races = await page.evaluate(() => {
        const raceTables = document.querySelectorAll('table.race-title');
        if (!raceTables || raceTables.length === 0) return null;

        return Array.from(raceTables).map((raceTable) => {
            // Get race title and details
            const titleElement = raceTable.querySelector('th span:first-child');
            const title = titleElement?.textContent?.trim();

            const detailsCell = raceTable.querySelector('td');
            const detailsText = detailsCell?.textContent?.trim() || '';

            // Extract track details using regex
            const trackNameMatch = detailsText.match(/Track Name:\s*(.*?)\s*Track Type:/);
            const trackTypeMatch = detailsText.match(/Track Type:\s*(.*?)\s*Track Condition:/);
            const conditionMatch = detailsText.match(/Track Condition:\s*(.*?)\s*Time:/);
            const timeMatch = detailsText.match(/Time:\s*(.*?)\s*Last 600m:/);
            const last600Match = detailsText.match(/Last 600m:\s*(.*?)\s*Timing Method:/);
            const timingMethodMatch = detailsText.match(/Timing Method:\s*(.*?)(?:\s*INTERIM RESULTS|$)/);

            // Find the next race-strip-fields table (contains horse results)
            const resultsTable = raceTable.nextElementSibling?.nextElementSibling as HTMLTableElement;
            const horses = Array.from(resultsTable?.querySelectorAll('tr'))
                .slice(1)
                .map((row) => {
                    const isScratched = row.classList.contains('Scratched');
                    const cells = row.querySelectorAll('td');
                    return {
                        scratched: isScratched,
                        finish: cells[1]?.textContent?.trim(),
                        number: cells[2]?.textContent?.trim(),
                        horse: {
                            name: cells[3]?.querySelector('a')?.textContent?.trim(),
                            url: cells[3]?.querySelector('a')?.getAttribute('href'),
                        },
                        trainer: {
                            name: cells[4]?.querySelector('a')?.textContent?.trim(),
                            url: cells[4]?.querySelector('a')?.getAttribute('href'),
                            id: '',
                        },
                        jockey: {
                            name: cells[5]?.querySelector('span.Hilite')?.textContent?.trim(),
                            claim: cells[5]?.querySelector('span.apprentice-claim')?.textContent?.trim(),
                            url: cells[5]?.querySelector('a')?.getAttribute('href'),
                            id: '',
                        },
                        margin: cells[6]?.textContent?.trim(),
                        barrier: cells[7]?.textContent?.trim(),
                        weight: cells[8]?.textContent?.trim(),
                        penalty: cells[9]?.textContent?.trim(),
                        startingPrice: cells[10]?.textContent?.trim(),
                    };
                });

            return {
                title,
                trackDetails: {
                    trackName: trackNameMatch?.[1]?.trim(),
                    trackType: trackTypeMatch?.[1]?.trim(),
                    trackCondition: conditionMatch?.[1]?.trim(),
                    time: timeMatch?.[1]?.trim(),
                    last600m: last600Match?.[1]?.trim(),
                    timingMethod: timingMethodMatch?.[1]?.trim(),
                },
                results: horses,
            };
        });
    });

    console.log('Races found:', races?.[2]);
    console.log(races?.[2]?.results?.[0]);

    // Add duplicate checking logic
    const duplicates = {
        horses: new Map<string, number>(),
        trainers: new Map<string, number>(),
        jockeys: new Map<string, number>(),
    };

    races?.forEach((race) => {
        race.results.forEach((result) => {
            // Count horses
            if (result.horse.name) {
                duplicates.horses.set(result.horse.name, (duplicates.horses.get(result.horse.name) || 0) + 1);
            }
            // Count trainers
            if (result.trainer.name) {
                duplicates.trainers.set(result.trainer.name, (duplicates.trainers.get(result.trainer.name) || 0) + 1);
            }
            // Count jockeys
            if (result.jockey.name) {
                duplicates.jockeys.set(result.jockey.name, (duplicates.jockeys.get(result.jockey.name) || 0) + 1);
            }
        });
    });

    // Process all persons at once
    const allPersons =
        races?.flatMap((race) =>
            race.results
                .map((result) => [
                    { name: result.trainer.name, url: result.trainer.url },
                    { name: result.jockey.name, url: result.jockey.url },
                ])
                .flat()
        ) ?? [];

    const personIdMap = await processPersons(allPersons);

    // Now use the map when processing race results
    races?.forEach((race) => {
        race.results.forEach((result) => {
            if (result.trainer.name) {
                result.trainer.id = personIdMap.get(result.trainer.name) ?? '';
            }
            if (result.jockey.name) {
                result.jockey.id = personIdMap.get(result.jockey.name) ?? '';
            }
        });
    });

    await browser.close();
}

function extractCodeFromUrl(url: string | undefined): string | null {
    if (!url) return null;

    const codeMatch = url.match(/code=([^&]+)/);
    return codeMatch ? decodeURIComponent(codeMatch[1]) : null;
}

function determinePersonType(url: string): EPerson {
    if (url.includes('Trainer')) return EPerson.TRAINER;
    if (url.includes('Jockey')) return EPerson.JOCKEY;
    return EPerson.OWNER;
}

interface PersonResult {
    name: string | undefined;
    url: string | undefined | null;
}

async function processPersons(persons: PersonResult[]): Promise<Map<string, string>> {
    await connectMongo();
    const personMap = new Map<string, string>();
    const personsToProcess = persons.filter((p) => p.name && p.url);

    // Extract codes and create lookup data
    const personLookups = personsToProcess
        .map((person) => ({
            code: extractCodeFromUrl(person.url ?? undefined),
            type: determinePersonType(person.url!),
            name: person.name,
        }))
        .filter((p) => p.code);

    // Get all existing persons in one query
    const codes = personLookups.map((p) => p.code);
    const existingPersons = await PersonModel.find({ code: { $in: codes } });

    // Create a map of existing persons by code
    const existingPersonMap = new Map(existingPersons.map((p) => [p.code, p._id.toString()]));

    // Process new persons in batch
    const newPersons = personLookups.filter((p) => !existingPersonMap.has(p.code));
    if (newPersons.length > 0) {
        const created = await PersonModel.insertMany(
            newPersons.map((p) => ({
                name: p.name,
                type: p.type,
                code: p.code,
            }))
        );

        created.forEach((p) => existingPersonMap.set(p.code, p._id.toString()));
    }

    // Build final result map
    personLookups.forEach((p) => {
        if (p.code) {
            personMap.set(p.name!, existingPersonMap.get(p.code)!);
        }
    });

    return personMap;
}
