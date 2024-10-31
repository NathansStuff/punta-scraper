import { model, models } from 'mongoose';

import { RaceDaySchema } from './raceDaySchema';
import { RaceDay } from './types/RaceDay';

export const RaceDayModel = models.RaceDay || model<RaceDay>('RaceDay', RaceDaySchema);
