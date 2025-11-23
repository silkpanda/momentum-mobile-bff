// src/routes/family.ts
import { Router, Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import { API_BASE_URL } from '../utils/config';
import logger from '../utils/logger';
import AppError from '../utils/AppError';

const router = Router();

router.get('/page-data', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new AppError('No authorization header', 401);
        }

        const [householdRes, tasksRes, storeRes] = await Promise.all([
            fetch(`${API_BASE_URL}/households`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/tasks`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/store-items`, { headers: { 'Authorization': authHeader } })
        ]);

        const [householdData, tasksData, storeData] = await Promise.all([
            householdRes.json(), tasksRes.json(), storeRes.json()
        ]);

        res.json({
            memberProfiles: householdData.data?.memberProfiles || [],
            tasks: tasksData.data?.tasks || [],
            storeItems: storeData.data?.storeItems || []
        });
    } catch (error) {
        logger.error('Failed to fetch family data', { error });
        next(error);
    }
});

export default router;
