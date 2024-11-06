import { createPerson, deletePersonById, getAllPersons, getPersonById, getPersonByCode, getPersonsByType } from './personDal';
import { Person, PersonWithId } from './personType';

// Service to get a Person by ID
export async function getPersonByIdService(id: string): Promise<PersonWithId | null> {
    return await getPersonById(id);
}

// Service to get all Persons
export async function getAllPersonsService(): Promise<PersonWithId[]> {
    return await getAllPersons();
}

// Service to create a Person
export async function createPersonService(person: Person): Promise<PersonWithId> {
    return await createPerson(person);
}

// Service to delete a Person
export async function deletePersonService(id: string): Promise<void> {
    return await deletePersonById(id);
}

// Service to get Person by Code
export async function getPersonByCodeService(code: string): Promise<PersonWithId | null> {
    return await getPersonByCode(code);
}

// Service to get Persons by Type
export async function getPersonsByTypeService(type: string): Promise<PersonWithId[]> {
    return await getPersonsByType(type);
}