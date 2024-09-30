import { isValidObjectId } from 'mongoose';
import * as z from 'zod';

export const ParamsWithId = z.object({
    id: z
        .string()
        .min(1)
        .refine(
            (val) => {
                try {
                    const valid = isValidObjectId(val);
                    if (valid) return val;
                    return false;
                } catch (error) {
                    return false;
                }
            },
            {
                message: 'Invalid ObjectId',
            }
        ),
});

export type ParamsWithId = z.infer<typeof ParamsWithId>;
