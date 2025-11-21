// src/routes/family.ts
import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { API_BASE_URL } from '../utils/config';

const router = Router();

router.get('/page-data', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'No authorization header' });

        const [householdRes, tasksRes, storeRes] = await Promise.all([
            fetch(`${API_BASE_URL}/households/me`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/tasks`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/store-items`, { headers: { 'Authorization': authHeader } })
        ]);

        const [householdData, tasksData, storeData] = await Promise.all([
            householdRes.json(), tasksRes.json(), storeRes.json()
        ]);

        res.json({
            memberProfiles: householdData.data?.household?.memberProfiles || [],
            tasks: tasksData.data?.tasks || [],
            storeItems: storeData.data?.storeItems || []
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch family data', error: error.message });
    }
});

export default router;
