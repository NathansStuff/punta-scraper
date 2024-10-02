import { connectMongo } from 'src/middleware/mongoDbConnect';

import { Horse, HorsePartial, HorseWithId } from './types/Horse';
import { HorseModel } from './horseModel';

// ***** Basic CRUD *****
// Create a Horse
export async function createHorse(horse: Horse): Promise<HorseWithId> {
    await connectMongo();
    const result = await HorseModel.create(horse);
    return result;
}

// Get a Horse by ID
export async function getHorseById(id: string): Promise<HorseWithId> {
    await connectMongo();
    const result = await HorseModel.findById(id);
    return result;
}

// Get all Horses
export async function getAllHorses(): Promise<HorseWithId[]> {
    await connectMongo();
    const result = await HorseModel.find({});
    return result;
}

// Update a Horse
export async function updateHorseById(id: string, Horse: HorsePartial): Promise<HorseWithId> {
    await connectMongo();
    const result = await HorseModel.findByIdAndUpdate(id, Horse, { new: true });
    return result;
}

// Delete a Horse
export async function deleteHorseById(id: string): Promise<void> {
    await connectMongo();
    await HorseModel.findByIdAndDelete(id);
}

// Get a horse by studbook ID
export async function getHorseByStudbookId(id: number): Promise<HorseWithId | null> {
    await connectMongo();
    const result = await HorseModel.findOne({ 'studbook.id': id });
    return result;
}