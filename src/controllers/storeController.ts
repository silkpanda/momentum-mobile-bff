import { Request, Response, NextFunction } from 'express';
import { apiClient } from '../lib/apiClient.js';
import { AxiosError } from 'axios';

/**
 * @desc    Get all available rewards for the household
 * @route   GET /api/v1/rewards
 * @access  Private (Requires JWT)
 */
export const getRewards = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    // We might need to pass a householdId query param if the user is in multiple households,
    // but usually the core API infers context from the user/profile or defaults.
    // For now, we'll forward query params.
    const queryParams = req.query;

    if (!authHeader) {
      return res.status(401).json({
        status: 'fail',
        message: 'No authorization token provided.',
      });
    }

    const response = await apiClient.get('/api/v1/rewards', {
      headers: {
        Authorization: authHeader,
      },
      params: queryParams,
    });

    res.status(200).json(response.data);
  } catch (error) {
    handleStoreError(error, res, 'fetching rewards');
  }
};

/**
 * @desc    Purchase a reward (deduct points)
 * @route   POST /api/v1/rewards/:id/purchase
 * @access  Private (Requires JWT)
 */
export const purchaseReward = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: 'fail',
        message: 'No authorization token provided.',
      });
    }

    if (!id) {
      return res.status(400).json({
        status: 'fail',
        message: 'Reward ID is required.',
      });
    }

    // Forward the purchase request to the core API
    const response = await apiClient.post(
      `/api/v1/rewards/${id}/purchase`,
      {}, // Body can be empty if only ID is needed, or pass req.body if quantity is needed
      {
        headers: {
          Authorization: authHeader,
        },
      },
    );

    res.status(200).json(response.data);
  } catch (error) {
    handleStoreError(error, res, `purchasing reward ${req.params.id}`);
  }
};

// Helper for consistent error handling in this controller
const handleStoreError = (error: unknown, res: Response, context: string) => {
  if (error instanceof AxiosError && error.response) {
    return res.status(error.response.status).json(error.response.data);
  }

  if (error instanceof Error) {
    console.error(`[storeController] Error ${context}:`, error.message);
  } else {
    console.error(`[storeController] Unexpected error ${context}:`, error);
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error in BFF.',
  });
};