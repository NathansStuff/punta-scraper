import express from 'express';
import { logRouter } from 'src/features/log/logRouter';
import { scraperRouter } from 'src/features/scraper/scraperRouter';

const v1Router = express.Router();

v1Router.use('/logs', logRouter);
v1Router.use('/scraper', scraperRouter);

export { v1Router };
