import { connectMongo } from 'src/middleware/mongoDbConnect';

import { Location, LocationPartial, LocationWithId } from './types/Location';
import { LocationModel } from './locationModel';

// Create a Location
export async function createLocation(location: Location): Promise<LocationWithId> {
    await connectMongo();
    const result = await LocationModel.create(location);
    return result;
}

// Get a Location by ID
export async function getLocationById(id: string): Promise<LocationWithId> {
    await connectMongo();
    const result = await LocationModel.findById(id);
    return result;
}

// Get all Locations
export async function getAllLocations(): Promise<LocationWithId[]> {
    await connectMongo();
    const result = await LocationModel.find({});
    return result;
}

// Update a Location
export async function updateLocationById(id: string, location: LocationPartial): Promise<LocationWithId> {
    await connectMongo();
    const result = await LocationModel.findByIdAndUpdate(id, location, { new: true });
    return result;
}

// Delete a Location
export async function deleteLocationById(id: string): Promise<void> {
    await connectMongo();
    await LocationModel.findByIdAndDelete(id);
}

// Get a Location by name and state
export async function getLocationByNameAndState(name: string, state: string): Promise<LocationWithId | null> {
    await connectMongo();
    const result = await LocationModel.findOne({ name, state });
    return result;
}
