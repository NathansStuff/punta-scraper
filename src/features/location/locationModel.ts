import { model, models } from 'mongoose';

import { Location } from './types/Location';
import { LocationSchema } from './locationSchema';

export const LocationModel = models.Location || model<Location>('Location', LocationSchema);
