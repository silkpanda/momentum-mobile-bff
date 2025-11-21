// src/routes/dashboard.ts
import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { API_BASE_URL } from '../utils/config';

const router = Router();

router.get('/page-data', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'No authorization header' });
        }

        // Fetch all data in parallel
        // FIX: Changed /households/me to /households as per API routes
        const [householdRes, tasksRes, storeRes] = await Promise.all([
            fetch(`${API_BASE_URL}/households`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/tasks`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/store-items`, { headers: { 'Authorization': authHeader } })
        ]);

        const [householdData, tasksData, storeData] = await Promise.all([
            householdRes.json(),
            tasksRes.json(),
            storeRes.json()
        ]);

        // Transform Household Data for UI
        let household = null;
        if (householdData.data) {
            const rawHousehold = householdData.data;
            household = {
                id: rawHousehold._id,
                name: rawHousehold.householdName,
                members: rawHousehold.memberProfiles?.map((p: any) => ({
                    id: p._id, // Use Profile ID for task assignment matching
                    userId: p.familyMemberId._id || p.familyMemberId, // Keep User ID for reference
                    firstName: p.displayName || p.familyMemberId.firstName, // Use Display Name if available
                    lastName: p.familyMemberId.lastName || '',
                    profileColor: p.profileColor,
                    pointsTotal: p.pointsTotal,
                    role: p.role
                })) || []
            };
        }

        res.json({
            household: household,
            tasks: tasksData.data?.tasks || [],
            storeItems: storeData.data?.storeItems || []
        });
    } catch (error: any) {
        console.error('Dashboard BFF Error:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
    }
});

export default router;
