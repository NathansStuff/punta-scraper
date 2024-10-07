/* eslint-disable no-inner-declarations */
import { Page } from 'puppeteer';
import { createHorseService, getHorseByStudbookIdService } from 'src/features/horse/horseService';
import { Horse } from 'src/features/horse/types/Horse';

import { HorseInfo } from './types/HorseInfo';
import { PedigreeTree } from './types/PedigreeInfo';
import { loadCookies, saveCookies } from './utils/utils';

export async function mapPedigreeTree(page: Page): Promise<PedigreeTree[]> {
    const pedigreeItems = await extractPedigreeInfo(page);
    return [
        {
            horse: {
                name: pedigreeItems[0]?.text,
                link: pedigreeItems[0]?.link,
            },
            father: {
                name: pedigreeItems[1]?.text,
                link: pedigreeItems[1]?.link,
            },
            mother: {
                name: pedigreeItems[2]?.text,
                link: pedigreeItems[2]?.link,
            },
        },
        {
            horse: {
                name: pedigreeItems[3]?.text,
                link: pedigreeItems[3]?.link,
            },
            father: {
                name: pedigreeItems[0]?.text,
                link: pedigreeItems[0]?.link,
            },
            mother: {
                name: pedigreeItems[4]?.text,
                link: pedigreeItems[4]?.link,
            },
        },
        {
            horse: {
                name: pedigreeItems[4]?.text,
                link: pedigreeItems[4]?.link,
            },
            father: {
                name: pedigreeItems[5]?.text,
                link: pedigreeItems[5]?.link,
            },
            mother: {
                name: pedigreeItems[6]?.text,
                link: pedigreeItems[6]?.link,
            },
        },
        {
            horse: {
                name: pedigreeItems[7]?.text,
                link: pedigreeItems[7]?.link,
            },
            father: {
                name: pedigreeItems[3]?.text,
                link: pedigreeItems[3]?.link,
            },
            mother: {
                name: pedigreeItems[11]?.text,
                link: pedigreeItems[11]?.link,
            },
        },
        {
            horse: {
                name: pedigreeItems[11]?.text,
                link: pedigreeItems[11]?.link,
            },
            father: {
                name: pedigreeItems[8]?.text,
                link: pedigreeItems[8]?.link,
            },
            mother: {
                name: pedigreeItems[12]?.text,
                link: pedigreeItems[12]?.link,
            },
        },
        {
            horse: {
                name: pedigreeItems[8]?.text,
                link: pedigreeItems[8]?.link,
            },
            father: {
                name: pedigreeItems[9]?.text,
                link: pedigreeItems[9]?.link,
            },
            mother: {
                name: pedigreeItems[10]?.text,
                link: pedigreeItems[10]?.link,
            },
        },
        {
            horse: {
                name: pedigreeItems[12]?.text,
                link: pedigreeItems[12]?.link,
            },
            father: {
                name: pedigreeItems[13]?.text,
                link: pedigreeItems[13]?.link,
            },
            mother: {
                name: pedigreeItems[14]?.text,
                link: pedigreeItems[14]?.link,
            },
        },
    ];
}

export async function login(page: Page): Promise<void> {
    await loadCookies(page);

    // Navigate to the login page
    await page.goto('https://www.studbook.org.au/Default.aspx');
    try {
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
    } catch (e) {
        console.error('Error logging in:', e);
    }
}

interface PedigreeItem {
    text: string;
    link: string;
    index: number;
}

async function extractPedigreeInfo(page: Page): Promise<PedigreeItem[]> {
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

export async function horseInfo(page: Page, targetHid: string): Promise<HorseInfo> {
    const items = await page.evaluate(() => {
        const info: HorseInfo = { logs: [] };

        const element = document.querySelector('td.HeaderBlockNasuy') as HTMLElement;
        const horseName = element ? element.innerText.trim() : undefined;
        info.name = horseName;

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

            // Find 'aust id'
            if (text.includes('aust.id.:')) {
                info.austId = text.replace('aust.id.:', '').trim();
            }

            // Find mare
            try {
                if (text.includes('mare')) {
                    let color: string | undefined = text.split('mare')[0].trim();
                    if (text.split('mare')[1] === undefined) {
                        color = undefined;
                    }
                    info.gender = 'mare';
                    info.color = color;
                }

                // Find stallion
                if (text.includes('stallion')) {
                    let color: string | undefined = text.split('stallion')[0].trim();
                    if (text.split('stallion')[1] === undefined) {
                        color = undefined;
                    }
                    info.gender = 'stallion';
                    info.color = color;
                }

                // Find stallion
                if (text.includes('gelding')) {
                    let color: string | undefined = text.split('gelding')[0].trim();
                    if (text.split('gelding')[1] === undefined) {
                        color = undefined;
                    }
                    info.gender = 'stallion';
                    info.color = color;
                }
            } catch (e) {
                info.logs.push('Error finding stallion/mare/gelding');
            }

            // Find bred by
            if (text.includes('bred by ')) {
                info.bredBy = td.innerText.replace('bred by ', '').trim(); // Note: Not text.replace to keep uppercase names
            }

            // Find deceased
            if (text.includes('deceased ')) {
                const dateStr = text.replace('deceased ', '').trim().replace('(', '').replace(')', '').trim();
                info.deceased = dateStr;
            }
        });

        // Extract the family
        const familyElement = Array.from(tdElements).find((td) => td.innerText.includes('Family:'));
        if (familyElement) {
            const familyText = familyElement.querySelector('b');
            info.family = familyText ? familyText.innerText.trim() : undefined;
        }

        // Extract the taproot hid
        const taprootElement = Array.from(tdElements).find((td) => td.innerText.includes('Taproot:'));
        if (taprootElement) {
            const taprootLink = taprootElement.querySelector('a.subscribelink') as HTMLAnchorElement;
            if (taprootLink) {
                const taprootHref = taprootLink.getAttribute('href');
                const taprootHidMatch = taprootHref?.match(/hid=(\d+)/);
                if (taprootHidMatch) {
                    info.taproot = {
                        name: taprootLink.innerText.trim(),
                        link: taprootHref ?? '',
                        studbookId: parseInt(taprootHidMatch[1], 10),
                    };
                }
            }
        }

        const foalRefElements = Array.from(tdElements).find((td) => td.innerText.includes('Foal ref: '));
        if (foalRefElements) {
            const text = 'Foal ref: ' + foalRefElements.innerText.trim();
            info.logs.push(text);
        }
        return info;
    }, targetHid);

    const pedigreeItems = await getPedigreeInfo(page);
    if (items.taproot) {
        const taproot = await findPedigreeIds([items.taproot]);
        items.taprootInfo = taproot[0];
    }
    const foalRef = findFoalRefFromText(items.logs[0], items.name ?? '');
    items.foalRef = foalRef;

    return { ...items, pedigreeTree: pedigreeItems };
}
function findFoalRefFromText(text: string, horse: string): string | undefined {
    try {
        if (text === undefined) {
            return undefined;
        }
        // Step 1: Remove newlines and trim extra spaces
        const cleanedText = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

        // Step 2: Match the horse's foal ref
        const match = cleanedText.split(horse)[1]?.trim();

        // Step 3: Extract the foal ref from the match
        const match2 = match.split('Foal ref: ')[1]?.trim();

        // Step 4: Return the foal ref
        const match3 = match2.split(' ')[0]?.trim();
        return match3; // Return the foal ref
    } catch (
        e // Log any errors
    ) {
        console.error('Error extracting foal ref:', e);
    }
}

async function findPedigreeIds(
    pedigreeTrees: { name: string; link: string; studbookId: number }[]
): Promise<{ name: string; studbookId: number; id: string }[]> {
    const returnArray = await Promise.all(
        pedigreeTrees.map(async (node) => {
            const existingHorse = await getHorseByStudbookIdService(node.studbookId);
            if (existingHorse) {
                return { id: existingHorse._id.toHexString(), name: node.name, studbookId: node.studbookId };
            }

            const newHorse: Horse = {
                name: node.name,
                studbook: {
                    id: node.studbookId,
                },
            };
            const createdHorse = await createHorseService(newHorse);
            console.log('Created Basic Pedigree Horse:', createdHorse.studbook?.id);
            return { id: createdHorse._id.toHexString(), name: node.name, studbookId: node.studbookId };
        })
    );

    return returnArray;
}

function mapPedigreeInfo(
    pedigreeTree: PedigreeTree[],
    pedigreeIds: { name: string; studbookId: number; id: string }[]
): {
    horse?: { name: string; id: string };
    father?: { name: string; id: string };
    mother?: { name: string; id: string };
}[] {
    const array: {
        horse?: { name: string; id: string };
        father?: { name: string; id: string };
        mother?: { name: string; id: string };
    }[] = [];

    pedigreeTree.forEach((tree) => {
        const horse = pedigreeIds.find((id) => id.name === tree.horse.name);
        const father = pedigreeIds.find((id) => id.name === tree.father.name);
        const mother = pedigreeIds.find((id) => id.name === tree.mother.name);
        if (!horse || !father || !mother) {
            return;
        }

        array.push({
            horse: { name: tree.horse.name, id: horse?.id },
            father: { name: tree.father.name, id: father?.id },
            mother: { name: tree.mother.name, id: mother?.id },
        });
    });

    return array;
}

function extractUniquePedigreeNodes(
    pedigreeTrees: PedigreeTree[]
): { name: string; link: string; studbookId: number }[] {
    // Step 1: Flatten all horse, father, and mother nodes into a single array
    const allNodes = pedigreeTrees.flatMap((tree) => [tree.horse, tree.father, tree.mother]);

    // Step 2: Filter out undefined or invalid nodes (i.e., nodes without text or link)
    const validNodes = allNodes.filter((node) => node?.name && node?.link);

    // Step 3: Filter for unique values based on the 'link' using a Map
    const uniqueNodes = Array.from(
        new Map(
            validNodes.map((item) => {
                const studbookId = parseInt(item.link.split('=')[1]); // Extract the studbookId from the link
                return [item.link, { ...item, studbookId }];
            })
        ).values()
    );

    return uniqueNodes;
}

export async function getPedigreeInfo(page: Page): Promise<
    {
        horse?: {
            name: string;
            id: string;
        };
        father?: {
            name: string;
            id: string;
        };
        mother?: {
            name: string;
            id: string;
        };
    }[]
> {
    const pedigreeTree = await mapPedigreeTree(page);
    const unique = extractUniquePedigreeNodes(pedigreeTree);
    const pedigreeIds = await findPedigreeIds(unique);
    const mappedPedigree = mapPedigreeInfo(pedigreeTree, pedigreeIds);

    return mappedPedigree;
}

export function sanitizeDate(dateString: string | undefined): Date | undefined {
    if (!dateString) {
        return undefined;
    }

    const dateParts = dateString.split('/');

    let day = parseInt(dateParts[0], 10);
    let month = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);

    // If day or month are invalid (like 00), default them to 1
    if (isNaN(day) || day === 0) {
        day = 1;
    }
    if (isNaN(month) || month === 0) {
        month = 1;
    }

    // If year is invalid, return undefined
    if (isNaN(year)) {
        return undefined;
    }

    // Create the date using UTC to avoid time zone offset issues
    return new Date(Date.UTC(year, month - 1, day));
}

export async function checkForServerError(page: Page): Promise<boolean> {
    const isError = await page.evaluate(() => {
        const h1Element = document.querySelector('h1');
        return h1Element && h1Element.innerText.includes('Server Error');
    });

    return isError || false;
}
