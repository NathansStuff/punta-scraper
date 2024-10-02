import { Request, Response } from 'express';

import { scraperService } from './scraperService';

export async function getScraperHandler(req: Request, res: Response): Promise<void> {
    const { startId, endId, delayMs } = req.body;
    const scraper = await scraperService(startId, endId, delayMs);
    res.status(200).json(scraper);
}
