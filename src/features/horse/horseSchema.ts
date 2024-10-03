import { Schema } from 'mongoose';

import { Horse } from './types/Horse';

export const HorseSchema = new Schema<Horse>(
    {
        name: { type: String, required: true },
        color: { type: String },
        height: { type: Number },
        sex: { type: String },
        age: { type: Number },
        photoUrl: { type: String },
        dateOfBirth: { type: Date },
        status: { type: String },
        wins: { type: Number, default: 0 },
        distanceTag: { type: String },
        speedFigures: { type: [Number] },
        pedigree: { type: String },
        currentTrainers: { type: [String], default: [] },
        previousTrainers: { type: [String], default: [] },
        currentJockeys: { type: [String], default: [] },
        previousJockeys: { type: [String], default: [] },
        totalRaces: { type: Number, default: 0 },
        totalWins: { type: Number, default: 0 },
        totalPlaces: { type: Number, default: 0 },
        averagePosition: { type: Number },
        averageSpeedFigure: { type: Number },
        bestRacePerformance: {
            raceId: { type: String },
            position: { type: Number },
            time: { type: Number },
        },
        lastRaceDate: { type: String },
        averageWinningTrackCondition: { type: String },
        averagePlacingTrackCondition: { type: String },
        siblings: { type: [String] },
        children: { type: [String] },
        fatherId: { type: String },
        motherId: { type: String },
        lifeNumber: { type: String },
        microchipNumber: { type: String },
        dnaTyped: { type: String },
        austId: { type: String },
        studbook: {
            id: { type: Number },
            firstScraped: { type: Date },
            lastScraped: { type: Date },
        },
        pedigreeInfo: [
            {
                horse: {
                    name: { type: String },
                    id: { type: String },
                },
                father: {
                    name: { type: String },
                    id: { type: String },
                },
                mother: {
                    name: { type: String },
                    id: { type: String },
                },
            },
        ],
        family: { type: String },
        taproot: {
            type: {
                name: { type: String },
                id: { type: String },
            },
        },
        foalRef: { type: String },
    },
    { timestamps: true }
);
