import { connectMongo } from 'src/middleware/mongoDbConnect';

import { PersonModel } from './personModel';
import { Person, PersonWithId } from './personType';

// Create a Person
export async function createPerson(person: Person): Promise<PersonWithId> {
    await connectMongo();
    const result = await PersonModel.create(person);
    return result;
}

// Get a Person by ID
export async function getPersonById(id: string): Promise<PersonWithId> {
    await connectMongo();
    const result = await PersonModel.findById(id);
    return result;
}

// Get all Persons
export async function getAllPersons(): Promise<PersonWithId[]> {
    await connectMongo();
    const result = await PersonModel.find({});
    return result;
}

// Delete a Person
export async function deletePersonById(id: string): Promise<void> {
    await connectMongo();
    await PersonModel.findByIdAndDelete(id);
}

// Get Person by Code
export async function getPersonByCode(code: string): Promise<PersonWithId | null> {
    await connectMongo();
    const result = await PersonModel.findOne({ code });
    return result;
}

// Get Persons by Type
export async function getPersonsByType(type: string): Promise<PersonWithId[]> {
    await connectMongo();
    const result = await PersonModel.find({ type });
    return result;
}