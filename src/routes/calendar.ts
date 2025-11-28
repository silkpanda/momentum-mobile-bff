// src/routes/calendar.ts
import { Router, Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import { API_BASE_URL } from '../utils/config';
import logger from '../utils/logger';
import AppError from '../utils/AppError';

const router = Router();

// Get Google OAuth URL
router.get('/google/auth-url', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError('No authorization header', 401);
        }

        const response = await fetch(`${API_BASE_URL}/calendar/google/auth-url`, {
            headers: { 'Authorization': authHeader }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new AppError('Failed to get auth URL from API', response.status);
        }

        res.json(data);
    } catch (error) {
        logger.error('Calendar Auth URL BFF Error', { error });
        next(error);
    }
});

// Get Google Calendar Events
router.get('/google/events', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError('No authorization header', 401);
        }

        const response = await fetch(`${API_BASE_URL}/calendar/google/events`, {
            headers: { 'Authorization': authHeader }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new AppError('Failed to get events from API', response.status);
        }

        res.json(data);
    } catch (error) {
        logger.error('Calendar Events BFF Error', { error });
        next(error);
    }
});

export default router;
