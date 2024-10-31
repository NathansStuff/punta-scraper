import { connectMongo } from 'src/middleware/mongoDbConnect';

import { RaceDayModel } from './raceDayModel';
import { RaceDay, RaceDayPartial, RaceDayWithId } from './types/RaceDay';

// Create a RaceDay
export async function createRaceDay(raceDay: RaceDay): Promise<RaceDayWithId> {
    await connectMongo();
    const result = await RaceDayModel.create(raceDay);
    return result;
}

// Get a RaceDay by ID
export async function getRaceDayById(id: string): Promise<RaceDayWithId> {
    await connectMongo();
    const result = await RaceDayModel.findById(id);
    return result;
}

// Get all RaceDays
export async function getAllRaceDays(): Promise<RaceDayWithId[]> {
    await connectMongo();
    const result = await RaceDayModel.find({}).populate('locationId');
    return result;
}

// Update a RaceDay
export async function updateRaceDayById(id: string, raceDay: RaceDayPartial): Promise<RaceDayWithId> {
    await connectMongo();
    const result = await RaceDayModel.findByIdAndUpdate(id, raceDay, { new: true });
    return result;
}

// Delete a RaceDay
export async function deleteRaceDayById(id: string): Promise<void> {
    await connectMongo();
    await RaceDayModel.findByIdAndDelete(id);
}

// Get RaceDays by Location ID
export async function getRaceDaysByLocationId(locationId: string): Promise<RaceDayWithId[]> {
    await connectMongo();
    const result = await RaceDayModel.find({ locationId }).populate('locationId');
    return result;
}

// Get RaceDay by Location ID and Date
export async function getRaceDayByLocationAndDate(locationId: string, date: Date): Promise<RaceDayWithId | null> {
    await connectMongo();
    const result = await RaceDayModel.findOne({
        locationId,
        date: {
            $gte: new Date(date.setHours(0, 0, 0, 0)),
            $lt: new Date(date.setHours(23, 59, 59, 999)),
        },
    }).populate('locationId');
    return result;
}

// Get RaceDays by Date Range
export async function getRaceDaysByDateRange(startDate: Date, endDate: Date): Promise<RaceDayWithId[]> {
    await connectMongo();
    const result = await RaceDayModel.find({
        date: {
            $gte: startDate,
            $lte: endDate,
        },
    }).populate('locationId');
    return result;
}
