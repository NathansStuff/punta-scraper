import { Request, Response } from 'express';
import { scraperService } from './scraperService';

export async function getScraperHandler(req: Request, res: Response): Promise<void> {
    const scraper = await scraperService();
    res.status(200).json(scraper);
}
