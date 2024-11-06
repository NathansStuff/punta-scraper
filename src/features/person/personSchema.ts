import { Schema } from 'mongoose';

import { Person } from './personType';

export const PersonSchema = new Schema<Person>(
    {
        name: { type: String, required: false },
        type: { type: String, required: true },
        code: { type: String, required: true },
    },
    { timestamps: true }
);