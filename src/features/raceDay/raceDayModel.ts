import { model, models } from 'mongoose';

import { RaceDay } from './types/RaceDay';
import { RaceDaySchema } from './raceDaySchema';


export const RaceDayModel = models.RaceDay || model<RaceDay>('RaceDay', RaceDaySchema);
