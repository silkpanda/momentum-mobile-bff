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

        // 1. Fetch Household First (Required for Wishlist)
        const householdRes = await fetch(`${API_BASE_URL}/households`, { headers: { 'Authorization': authHeader } });
        const householdData = await householdRes.json();

        // Transform Household Data early to get ID
        let household = null;
        let rawHousehold: HouseholdData | null = null;
        let householdId = '';

        if (householdData.data) {
            if (Array.isArray(householdData.data)) {
                rawHousehold = householdData.data[0];
            } else {
                rawHousehold = householdData.data as HouseholdData;
            }

            if (rawHousehold) {
                householdId = rawHousehold._id;
                household = {
                    id: rawHousehold._id,
                    name: rawHousehold.householdName,
                    members: rawHousehold.memberProfiles?.map((p: MemberProfile) => ({
                        id: p._id,
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

        // 2. Fetch Everything Else in Parallel
        const [
            tasksRes,
            storeRes,
            questsRes,
            routinesRes,
            mealsRes,
            restaurantsRes,
            wishlistRes
        ] = await Promise.all([
            fetch(`${API_BASE_URL}/tasks`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/store-items`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/quests`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/routines`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/meals/recipes`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/meals/restaurants`, { headers: { 'Authorization': authHeader } }),
            // Only fetch wishlist if we have a household ID
            householdId ? fetch(`${API_BASE_URL}/wishlist/household/${householdId}`, { headers: { 'Authorization': authHeader } }) : Promise.resolve(null)
        ]);

        const [
            tasksData,
            storeData,
            questsData,
            routinesData,
            mealsData,
            restaurantsData,
            wishlistData
        ] = await Promise.all([
            tasksRes.json(),
            storeRes.json(),
            questsRes.json(),
            routinesRes.json(),
            mealsRes.json(),
            restaurantsRes.json(),
            wishlistRes ? wishlistRes.json() : { data: { wishlistItems: [] } }
        ]);

        // Populations
        const memberProfiles = rawHousehold?.memberProfiles || [];
        const populatedTasks = tasksData.data?.tasks
            ? populateTaskAssignments(tasksData.data.tasks, memberProfiles)
            : [];

        res.json({
            status: 'success',
            data: {
                household: household,
                tasks: Array.isArray(populatedTasks) ? populatedTasks : [populatedTasks],
                storeItems: storeData.data?.storeItems || [],
                quests: questsData.data?.quests || [],
                routines: routinesData.data?.routines || [],
                meals: mealsData.data?.recipes || [],
                restaurants: restaurantsData.data?.restaurants || [],
                wishlistItems: wishlistData.data?.wishlistItems || []
            }
        });
    } catch (error) {
        logger.error('Dashboard BFF Error', { error });
        next(error);
    }
});

export default router;
