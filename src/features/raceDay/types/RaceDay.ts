import { ObjectId, WithId } from 'mongodb';
import { z } from 'zod';

export const RaceDay = z.object({
    locationId: z.string(),
    date: z.date(),
    urlExtension: z.string(),
});

export const RaceDayPartial = RaceDay.partial();

export type RaceDay = z.infer<typeof RaceDay>;
export type RaceDayWithId = WithId<RaceDay> & {
    _id: ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
export type RaceDayPartial = z.infer<typeof RaceDayPartial>;
