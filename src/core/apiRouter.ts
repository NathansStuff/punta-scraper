import express from 'express';


const apiRouter = express.Router();

apiRouter.get('/test', (req, res) => {
    res.status(200).json({ message: 'Test endpoint' });
});

export { apiRouter };

