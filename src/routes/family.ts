// src/routes/family.ts
import { Router, Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import { API_BASE_URL } from '../utils/config';
import logger from '../utils/logger';
import AppError from '../utils/AppError';
import { populateTaskAssignments } from '../utils/populateTaskAssignments';

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

        // Extract member profiles for task population
        const memberProfiles = householdData.data?.memberProfiles || [];

        // Populate task assignments with member details
        const populatedTasks = tasksData.data?.tasks
            ? populateTaskAssignments(tasksData.data.tasks, memberProfiles)
            : [];

        res.json({
            status: 'success',
            data: {
                memberProfiles: memberProfiles,
                tasks: Array.isArray(populatedTasks) ? populatedTasks : [populatedTasks],
                storeItems: storeData.data?.storeItems || []
            }
        });
    } catch (error) {
        logger.error('Failed to fetch family data', { error });
        next(error);
    }
});

// Create Member
router.post('/members', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const { householdId, ...memberData } = req.body;

        if (!authHeader) throw new AppError('No authorization header', 401);
        if (!householdId) throw new AppError('Household ID is required', 400);

        const response = await fetch(`${API_BASE_URL}/households/${householdId}/members`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(memberData)
        });

        const data = await response.json();
        if (!response.ok) throw new AppError(data.message || 'Failed to create member', response.status);

        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Update Member
router.put('/members/:memberId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const { memberId } = req.params;
        const { householdId, ...memberData } = req.body;

        if (!authHeader) throw new AppError('No authorization header', 401);
        if (!householdId) throw new AppError('Household ID is required', 400);

        const response = await fetch(`${API_BASE_URL}/households/${householdId}/members/${memberId}`, {
            method: 'PUT',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(memberData)
        });

        const data = await response.json();
        if (!response.ok) throw new AppError(data.message || 'Failed to update member', response.status);

        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Delete Member
router.delete('/members/:memberId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const { memberId } = req.params;
        const { householdId } = req.body; // householdId usually needed for sub-resource deletion logic or permission check

        if (!authHeader) throw new AppError('No authorization header', 401);
        if (!householdId) throw new AppError('Household ID is required', 400);

        const response = await fetch(`${API_BASE_URL}/households/${householdId}/members/${memberId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ householdId }) // Pass it if needed by API, or just URL
        });

        if (response.status === 204) {
            res.status(204).send();
            return;
        }

        const data = await response.json();
        if (!response.ok) throw new AppError(data.message || 'Failed to delete member', response.status);

        res.json(data);
    } catch (error) {
        next(error);
    }
});

export default router;
