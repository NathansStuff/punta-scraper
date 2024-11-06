import { Schema } from 'mongoose';

import { RaceDay } from './types/RaceDay';

export const RaceDaySchema = new Schema<RaceDay>(
    {
        locationId: { type: String, required: true, ref: 'Location' },
        date: { type: Date, required: true },
        urlExtension: { type: String, required: true },
    },
    { timestamps: true }
);

// Create a compound index on locationId and date to ensure uniqueness
RaceDaySchema.index({ locationId: 1, date: 1 }, { unique: true });
