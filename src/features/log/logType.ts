import { WithId } from 'mongodb';
import * as z from 'zod';

export const Log = z.object({
    // ***** Fields from the request - no payload required *****
    authorisation: z.string().optional(), // We grab this from the headers
    requestBody: z.string().optional(),
    responseBody: z.string().optional(),
    responseStatus: z.number().optional(),
    ipAddress: z.string().optional(),
    auditTimer: z.number().optional(),
    endpoint: z.string().optional(),
    partnerId: z.string().optional(), // If a authorisation is provided and matches a partner identifier, we save this here in case the partner rotates their auth key in the future.
});

export type Log = z.infer<typeof Log>;
export type LogWithId = WithId<Log> & {
    createdAt: Date;
    updatedAt: Date;
};

export const LogRequest = z.object({
    partnerId: z.string(),
    clientId: z.string().optional(),
    days: z.number().optional(),
});

export type LogRequest = z.infer<typeof LogRequest>;
