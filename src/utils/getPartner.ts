import { getPartnerByApiKey } from 'src/features/partner/partnerService';

export async function getPartnerDetail(req: any): Promise<any> {
    const apiKey = req.headers['x-api-key'];
    const partner = await getPartnerByApiKey(apiKey as string);
    return partner;
}
