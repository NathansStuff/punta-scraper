import { RaceDay, RaceDayWithId } from './types/RaceDay';
import {
    createRaceDay,
    deleteRaceDayById,
    getAllRaceDays,
    getRaceDayById,
    getRaceDayByLocationAndDate,
    getRaceDaysByDateRange,
    getRaceDaysByLocationId,
    updateRaceDayById,
} from './raceDayDal';

// Service to get a raceDay by ID
export async function getRaceDayByIdService(id: string): Promise<RaceDayWithId | null> {
    return await getRaceDayById(id);
}

// Service to get all raceDays
export async function getAllRaceDaysService(): Promise<RaceDayWithId[]> {
    return await getAllRaceDays();
}

// Service to create a raceDay
export async function createRaceDayService(raceDay: RaceDay): Promise<RaceDayWithId> {
    return await createRaceDay(raceDay);
}

// Service to update a raceDay
export async function updateRaceDayService(id: string, raceDay: RaceDayWithId): Promise<RaceDayWithId> {
    return await updateRaceDayById(id, raceDay);
}

// Service to delete a raceDay
export async function deleteRaceDayService(id: string): Promise<void> {
    return await deleteRaceDayById(id);
}

// Service to get raceDays by location ID
export async function getRaceDaysByLocationIdService(locationId: string): Promise<RaceDayWithId[]> {
    return await getRaceDaysByLocationId(locationId);
}

// Service to get raceDay by location and date
export async function getRaceDayByLocationAndDateService(locationId: string, date: Date): Promise<RaceDayWithId | null> {
    return await getRaceDayByLocationAndDate(locationId, date);
}

// Service to get raceDays by date range
export async function getRaceDaysByDateRangeService(startDate: Date, endDate: Date): Promise<RaceDayWithId[]> {
    return await getRaceDaysByDateRange(startDate, endDate);
}