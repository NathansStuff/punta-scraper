import express, { Express } from 'express';
import { logMiddleware } from 'src/middleware/logMiddleware';

import { v1Router } from './v1Router';

const app: Express = express();
app.use(express.json({ limit: '10mb' })); // Increased the limit to 10 megabytes for bank statements
app.use(logMiddleware);
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.use('/v1', v1Router);

export default app;
