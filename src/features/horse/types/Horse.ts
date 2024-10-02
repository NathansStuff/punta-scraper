import { ObjectId, WithId } from 'mongodb';
import { ELivingStatus } from 'src/types/ELivingStatus';
import { ETrackCondition } from 'src/types/ETrackConditon';
import { z } from 'zod';

import { EDistanceTag } from './EDistanceTag';
import { ESex } from './ESex';

// Horse Schema
// Horses don't know about races, sales, or performances. They are just horses.
export const Horse = z.object({
    name: z.string(),
    color: z.string().optional(),
    height: z.number().optional(),
    sex: z.nativeEnum(ESex).optional(),
    age: z.number().optional(),
    photoUrl: z.string().url().optional(),
    dateOfBirth: z.date().optional(),
    status: z.nativeEnum(ELivingStatus).optional(),
    wins: z.number().default(0).optional(),
    distanceTag: z.nativeEnum(EDistanceTag).optional(), // Stamina, speed etc.
    speedFigures: z.number().array().optional(),
    pedigree: z.string().optional(), // Pedigree relationship
    currentTrainers: z.array(z.string()).default([]).optional(), // Trainer IDs
    previousTrainers: z.array(z.string()).default([]).optional(), // Trainer IDs
    currentJockeys: z.array(z.string()).default([]).optional(), // Jockey IDs
    previousJockeys: z.array(z.string()).default([]).optional(), // Jockey IDs
    totalRaces: z.number().default(0).optional(), // Total number of races the horse has participated in
    totalWins: z.number().default(0).optional(), // Total number of wins
    totalPlaces: z.number().default(0).optional(), // Total number of places (e.g., top 3 finish)
    averagePosition: z.number().optional(), // Average finishing position across races
    averageSpeedFigure: z.number().optional(), // Average speed figure (e.g., timeform rating)
    bestRacePerformance: z
        .object({
            raceId: z.string(),
            position: z.number(),
            time: z.number().optional(),
        })
        .optional(), // The best race performance for the horse (optional)
    lastRaceDate: z.string().optional(), // Date of the horse's last race
    averageWinningTrackCondition: z.nativeEnum(ETrackCondition).optional(), // Average track condition when the horse wins
    averagePlacingTrackCondition: z.nativeEnum(ETrackCondition).optional(), // Average track condition when the horse places
    siblings: z.array(z.string()).optional(), // Sibling horse IDs
    children: z.array(z.string()).optional(), // Offspring horse IDs
    fatherId: z.string().optional(), // Horse's father
    motherId: z.string().optional(), // Horse's mother
    lifeNumber: z.string().optional(), // Life number of the horse
    microchipNumber: z.string().optional(), // Microchip number of the horse
    dnaTyped: z.string().optional(),
    austId: z.string().optional(),
    studbook: z
        .object({
            id: z.number(),
            firstScraped: z.date().optional(),
            lastScraped: z.date().optional(),
        })
        .optional(),
    pedigreeInfo: z
        .array(
            z
                .object({
                    horse: z
                        .object({
                            name: z.string(),
                            id: z.string(),
                        })
                        .optional(),
                    father: z
                        .object({
                            name: z.string(),
                            id: z.string(),
                        })
                        .optional(),
                    mother: z
                        .object({
                            name: z.string(),
                            id: z.string(),
                        })
                        .optional(),
                })
                .optional()
        )
        .optional(),
});

export const HorsePartial = Horse.partial();

export type Horse = z.infer<typeof Horse>;
export type HorseWithId = WithId<Horse> & {
    _id: ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
export type HorsePartial = z.infer<typeof HorsePartial>;
