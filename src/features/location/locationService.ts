import { Location, LocationWithId } from './types/Location';
import {
    createLocation,
    deleteLocationById,
    getAllLocations,
    getLocationById,
    getLocationByNameAndState,
    updateLocationById,
} from './locationDal';

// Service to get a location by ID
export async function getLocationByIdService(id: string): Promise<LocationWithId | null> {
    return await getLocationById(id);
}

// Service to get all locations
export async function getAllLocationsService(): Promise<LocationWithId[]> {
    return await getAllLocations();
}

// Service to create a location
export async function createLocationService(location: Location): Promise<LocationWithId> {
    return await createLocation(location);
}

// Service to update a location
export async function updateLocationService(id: string, location: LocationWithId): Promise<LocationWithId> {
    return await updateLocationById(id, location);
}

// Service to delete a location
export async function deleteLocationService(id: string): Promise<void> {
    return await deleteLocationById(id);
}

// Service to get a location by name and state
export async function getLocationByNameAndStateService(name: string, state: string): Promise<LocationWithId | null> {
    return await getLocationByNameAndState(name, state);
}