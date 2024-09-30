import { Request, Response } from 'express';
import { AuthenticationError } from 'src/exceptions/AuthenticationError';
import { EActionAccess } from 'src/types/EActionAccess';

export async function protect(req: Request, res: Response, action: EActionAccess): Promise<void> {
    // Expect {headers: {x-api-key: "your_api_key"}}
    const apiKey = req.headers['x-api-key'];
    res.locals.apiKey = apiKey;

    if (!apiKey || typeof apiKey !== 'string') {
        throw new AuthenticationError('API key is missing');
    }

    if (apiKey !== '123') {
        // todo: replace with actual API key
        throw new AuthenticationError('API key is invalid');
    }
}
