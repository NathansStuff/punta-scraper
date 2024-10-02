import { Horse, HorseWithId } from './types/Horse';
import {
    createHorse,
    deleteHorseById,
    getAllHorses,
    getHorseById,
    getHorseByStudbookId,
    updateHorseById,
} from './horseDal';

// Service to get a horse by ID
export async function getHorseByIdService(id: string): Promise<HorseWithId | null> {
    return await getHorseById(id);
}

// Service to get all horses
export async function getAllHorsesService(): Promise<HorseWithId[]> {
    return await getAllHorses();
}

// Service to create a horse
export async function createHorseService(horse: Horse): Promise<HorseWithId> {
    return await createHorse(horse);
}

// Service to update a horse
export async function updateHorseService(id: string, horse: HorseWithId): Promise<HorseWithId> {
    return await updateHorseById(id, horse);
}

// Service to delete a horse
export async function deleteHorseService(id: string): Promise<void> {
    return await deleteHorseById(id);
}

// Service to get a horse by studbook ID
export async function getHorseByStudbookIdService(id: number): Promise<HorseWithId | null> {
    return await getHorseByStudbookId(id);
}
