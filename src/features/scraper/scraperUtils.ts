import { Page } from 'puppeteer';
import { createHorseService, getHorseByStudbookIdService } from 'src/features/horse/horseService';
import { Horse } from 'src/features/horse/types/Horse';

import { HorseInfo } from './types/HorseInfo';
import { PedigreeTree } from './types/PedigreeInfo';
import { saveCookies } from './utils/utils';

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

export async function horseInfo(page: Page): Promise<HorseInfo> {
    const items = await page.evaluate(() => {
        const info: HorseInfo = {};

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
            if (text.includes('aust id:')) {
                info.austId = text.replace('aust id:', '').trim();
            }
        });

        return info;
    });

    const pedigreeItems = await getPedigreeInfo(page);
    return { ...items, pedigreeTree: pedigreeItems };
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

    console.log('Pedigree Tree:', pedigreeTree[0]);
    console.log('Pedigree IDs:', pedigreeIds[0]);

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

    // Step 2: Filter for unique values based on the 'link' using a Map
    const uniqueNodes = Array.from(
        new Map(
            allNodes.map((item) => {
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
