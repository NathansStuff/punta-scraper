import { Request, Response } from 'express';

import { scraperService } from './scraperService';

export async function startScraperHandler(req: Request, res: Response): Promise<void> {
    const { startId, endId, delayMs, numBrowsers } = req.body;

    try {
        await scraperService(startId, endId, delayMs, numBrowsers);
        res.status(200).json({ message: 'Scraping completed successfully' });
    } catch (error) {
        console.error('Error in scraper:', error);
        res.status(500).json({ error: 'An error occurred during scraping' });
    }
}
