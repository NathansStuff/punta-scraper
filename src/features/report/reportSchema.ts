import { Schema } from 'mongoose';

import { Report } from './reportType';

export const ReportSchema = new Schema<Report>(
    {
        event: { type: String, required: true },
        message: { type: String, required: true },
        url: { type: String, required: true },
        outcome: { type: String, required: true },
        studbookId: { type: Number, required: false },
    },
    { timestamps: true }
);
