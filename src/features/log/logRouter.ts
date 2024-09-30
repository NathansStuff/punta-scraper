import express from 'express';
import { protectedAccessMiddleware } from 'src/middleware/protectedAccessMiddleware';
import { EActionAccess } from 'src/types';

import {
    getAllLogsForPartnerIdAndClientIdHandler,
    getAllLogsForPartnerIdHandler,
    getAllLogsHandler,
} from './logController';

const logRouter = express.Router();

const logAction = EActionAccess.LOGS;

logRouter.route('/partnerLog').post(protectedAccessMiddleware(logAction, getAllLogsForPartnerIdHandler));
logRouter
    .route('/partnerClientLog')
    .post(protectedAccessMiddleware(logAction, getAllLogsForPartnerIdAndClientIdHandler));

logRouter.route('/').get(protectedAccessMiddleware(logAction, getAllLogsHandler));

// Deliberately not implementing the other CRUD operations for logs

export { logRouter };
