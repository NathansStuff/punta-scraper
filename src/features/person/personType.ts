import { WithId } from 'mongodb';
import * as z from 'zod';

import { EPerson } from './EPerson';

export const Person = z.object({
    name: z.string().optional(),
    type: z.nativeEnum(EPerson),
    code: z.string(),
});

export type Person = z.infer<typeof Person>;
export type PersonWithId = WithId<Person> & {
    createdAt: Date;
    updatedAt: Date;
};
