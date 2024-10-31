import express from 'express';
import { protectedAccessMiddleware } from 'src/middleware/protectedAccessMiddleware';
import { EActionAccess } from 'src/types';

import { startRacingAusScraperHandler, startScraperHandler } from './scraperController';

const scraperRouter = express.Router();

const logAction = EActionAccess.LOGS;

scraperRouter.route('/').post(protectedAccessMiddleware(logAction, startScraperHandler));
scraperRouter.route('/racingaus').post(protectedAccessMiddleware(logAction, startRacingAusScraperHandler));

export { scraperRouter };
