import puppeteer, { Browser } from 'puppeteer';

export async function getBrowser(): Promise<Browser> {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 800,
            height: 600,
        },
        args: ['--window-size=800,600', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    return browser;
}
