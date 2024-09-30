import { Request, Response } from 'express';
import { AuthenticationError } from 'src/exceptions/AuthenticationError';
import { getPartnerByApiKey } from 'src/features/partner/partnerService';
import { EActionAccess } from 'src/types/EActionAccess';

export async function protect(req: Request, res: Response, action: EActionAccess): Promise<void> {
    // Expect {headers: {x-api-key: "your_api_key"}}
    const apiKey = req.headers['x-api-key'];
    res.locals.apiKey = apiKey;

    if (!apiKey || typeof apiKey !== 'string') {
        throw new AuthenticationError('API key is missing');
    }

    const partner = await getPartnerByApiKey(apiKey);
    res.locals.partnerId = partner?._id.toString();
    req.body.partner = partner

    if (!partner) {
        throw new AuthenticationError('API key is invalid');
    }

    const partnerActionAccess = partner.actionAccess;

    if (!partnerActionAccess.includes(action) && !partnerActionAccess.includes(EActionAccess.ALL)) {
        throw new AuthenticationError('Sorry, you do not have access to this action');
    }
}
