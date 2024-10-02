import { model, models } from 'mongoose';

import { Horse } from './types/Horse';
import { HorseSchema } from './horseSchema';

export const HorseModel = models.Horse || model<Horse>('Horse', HorseSchema);
