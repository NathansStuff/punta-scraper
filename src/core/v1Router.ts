import express from 'express';
import { addressLookupRouter } from 'src/features/addressLookup/addressLookupRouter';
import { logRouter } from 'src/features/log/logRouter';
import { partnerRouter } from 'src/features/partner/partnerRouter';
import { syncLogRouter } from 'src/features/syncLog/syncLogRouter';

export const ADDRESS_LOOKUP_STRING = '/addressLookup';

const v1Router = express.Router();

v1Router.use('/partner', partnerRouter);
v1Router.use('/logs', logRouter);
v1Router.use(ADDRESS_LOOKUP_STRING, addressLookupRouter);
v1Router.use('/syncLogs', syncLogRouter);

export { v1Router };
