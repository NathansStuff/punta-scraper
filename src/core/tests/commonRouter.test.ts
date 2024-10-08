import express from 'express';
import { commonRouter } from 'src/core/commonRouter';
import request from 'supertest';

const app = express();
app.use(express.json());
app.use(commonRouter);

describe('Common Router', () => {
    it('should handle unknown routes with a 404 status', async () => {
        const response = await request(app).get('/invalid-route');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Route Not Found');
    });
});
