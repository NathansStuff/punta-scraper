import { WithId } from 'mongodb';
import * as z from 'zod';

import { EOutcome } from './EOutcome';

export const Report = z.object({
    event: z.string(),
    message: z.string(),
    url: z.string(),
    outcome: z.nativeEnum(EOutcome),
    studbookId: z.number().optional(),
});

export type Report = z.infer<typeof Report>;
export type ReportWithId = WithId<Report> & {
    createdAt: Date;
    updatedAt: Date;
};
