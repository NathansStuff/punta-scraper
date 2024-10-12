import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { scraperService } from './src/features/scraper/scraperService';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { startId, endId, delayMs, numBrowsers } = JSON.parse(event.body || '{}');

    if (!startId || !endId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'startId and endId are required' }),
        };
    }

    try {
        await scraperService(startId, endId, delayMs, numBrowsers);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Scraping completed successfully' }),
        };
    } catch (error) {
        console.error('Error in scraper:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An error occurred during scraping' }),
        };
    }
};
