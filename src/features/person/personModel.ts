import { model, models } from 'mongoose';

import { PersonSchema } from './personSchema';
import { Person } from './personType';

export const PersonModel = models.Person || model<Person>('Person', PersonSchema);