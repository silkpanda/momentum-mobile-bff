// src/routes/dashboard.ts
import { Router, Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import { API_BASE_URL } from '../utils/config';
import logger from '../utils/logger';
import AppError from '../utils/AppError';
import { populateTaskAssignments } from '../utils/populateTaskAssignments';

const router = Router();

interface MemberProfile {
    _id: string;
    familyMemberId: { _id?: string; firstName?: string; lastName?: string } | string;
    displayName?: string;
    profileColor: string;
    pointsTotal: number;
    role: string;
    focusedTaskId?: string;
    isLinkedChild?: boolean;
}

interface HouseholdData {
    _id: string;
    householdName: string;
    memberProfiles?: MemberProfile[];
}

router.get('/page-data', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError('No authorization header', 401);
        }

        // Fetch all data in parallel
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

        logger.info('Dashboard Data Fetch:', {
            householdStatus: householdRes.status,
            householdDataPreview: JSON.stringify(householdData).substring(0, 500)
        });

        // Transform Household Data for UI
        let household = null;
        let rawHousehold: HouseholdData | null = null;

        if (householdData.data) {
            // Handle array vs single object response
            if (Array.isArray(householdData.data)) {
                rawHousehold = householdData.data[0];
                logger.info('Household data is an array, using first item');
            } else {
                rawHousehold = householdData.data as HouseholdData;
            }

            if (rawHousehold) {
                household = {
                    id: rawHousehold._id,
                    name: rawHousehold.householdName,
                    members: rawHousehold.memberProfiles?.map((p: MemberProfile) => ({
                        id: p._id, // Use Profile ID for task assignment matching
                        userId: typeof p.familyMemberId === 'object' ? p.familyMemberId._id : p.familyMemberId,
                        firstName: p.displayName || (typeof p.familyMemberId === 'object' ? p.familyMemberId.firstName : ''),
                        lastName: typeof p.familyMemberId === 'object' ? p.familyMemberId.lastName : '',
                        profileColor: p.profileColor,
                        pointsTotal: p.pointsTotal,
                        role: p.role,
                        focusedTaskId: p.focusedTaskId,
                        isLinkedChild: p.isLinkedChild || false
                    })) || []
                };
            }
        }

        // Populate task assignments with member details
        const memberProfiles = rawHousehold?.memberProfiles || [];
        const populatedTasks = tasksData.data?.tasks
            ? populateTaskAssignments(tasksData.data.tasks, memberProfiles)
            : [];

        res.json({
            status: 'success',
            data: {
                household: household,
                tasks: Array.isArray(populatedTasks) ? populatedTasks : [populatedTasks],
                storeItems: storeData.data?.storeItems || []
            }
        });
    } catch (error) {
        logger.error('Dashboard BFF Error', { error });
        next(error);
    }
});

export default router;
