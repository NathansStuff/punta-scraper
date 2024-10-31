import { Schema } from 'mongoose';

import { Location } from './types/Location';

export const LocationSchema = new Schema<Location>(
    {
        name: { type: String, required: true },
        state: { type: String, required: true },
    },
    { timestamps: true }
);
