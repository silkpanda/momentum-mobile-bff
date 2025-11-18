import { Request, Response, NextFunction } from 'express';
import { apiClient } from '../lib/apiClient.js';
import { AxiosError } from 'axios';

/**
 * @desc    Get ALL Kiosk data (Tasks, Rewards, Household Context) in one "Calm" payload.
 * @route   GET /api/v1/kiosk-data
 * @access  Private (Requires JWT)
 */
export const getKioskData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: 'fail',
        message: 'No authorization token provided.',
      });
    }

    const config = {
      headers: { Authorization: authHeader },
    };

    // 1. Execute Parallel Requests to the Core API (Service 1)
    // We want to fetch everything needed for the Kiosk at once to minimize loading states.
    const [tasksRes, rewardsRes, householdRes] = await Promise.all([
      apiClient.get('/api/v1/tasks', config),
      apiClient.get('/api/v1/store-items', config),
      // We fetch the "My Household" context to get member points/profiles
      apiClient.get('/api/v1/households', config), 
    ]);

    // 2. Extract Data
    // The Core API wraps responses in { status: 'success', data: { ... } }
    const tasks = tasksRes.data.data.tasks || [];
    const rewards = rewardsRes.data.data.storeItems || [];
    // 'getMyHouseholds' returns the single household object directly in data
    const household = householdRes.data.data || null;

    // 3. Construct the "Calm Payload"
    // The Mobile App only needs to hit this ONE endpoint to run the entire Kiosk.
    const kioskPayload = {
      household,
      tasks,
      rewards,
    };

    res.status(200).json({
      status: 'success',
      data: kioskPayload,
    });

  } catch (error) {
    // --- Error Handling ---
    if (error instanceof AxiosError && error.response) {
      console.error('[kioskController] API Error:', error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }

    if (error instanceof Error) {
      console.error('[kioskController] Unexpected error:', error.message);
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to aggregate Kiosk Data in BFF.',
    });
  }
};