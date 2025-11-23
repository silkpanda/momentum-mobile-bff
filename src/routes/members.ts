// src/routes/members.ts
import { Router, Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import { API_BASE_URL } from '../utils/config';
import logger from '../utils/logger';
import AppError from '../utils/AppError';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const auth = req.headers.authorization;
        if (!auth) {
            throw new AppError('No authorization', 401);
        }

        const response = await fetch(`${API_BASE_URL}/households/me`, {
            headers: { 'Authorization': auth }
        });

        const data = await response.json();
        res.json({ memberProfiles: data.data?.household?.memberProfiles || [] });
    } catch (error) {
        logger.error('Failed to fetch members', { error });
        next(error);
    }
});

export default router;
