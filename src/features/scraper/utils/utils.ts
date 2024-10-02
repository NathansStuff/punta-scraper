import fs from 'fs';
import path from 'path';
import { Page } from 'puppeteer';

// File to save cookies
const cookiesFilePath = path.join(__dirname, 'cookies.json');
// File to save the raw HTML
const htmlFilePath = path.join(__dirname, 'rawPage.html');

// Function to save cookies
export async function saveCookies(page: Page): Promise<void> {
    const cookies = await page.cookies();
    fs.writeFileSync(cookiesFilePath, JSON.stringify(cookies, null, 2));
    console.log('Cookies saved.');
}

// Function to load cookies
export async function loadCookies(page: Page): Promise<boolean> {
    if (fs.existsSync(cookiesFilePath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiesFilePath, 'utf-8'));
        await page.setCookie(...cookies);
        console.log('Cookies loaded.');
        return true; // Return true if cookies exist
    }
    return false; // Return false if no cookies
}

// Function to save the raw HTML of the page
export async function saveRawHTML(page: Page): Promise<void> {
    const rawHTML = await page.content(); // Get the raw HTML of the page
    fs.writeFileSync(htmlFilePath, rawHTML);
    console.log(`Raw HTML saved to ${htmlFilePath}`);
}
