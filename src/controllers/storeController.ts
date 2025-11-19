import { Request, Response, NextFunction } from 'express';
import { apiClient } from '../lib/apiClient.js';
import { AxiosError } from 'axios';

/**
 * @desc    Get all available rewards for the household
 * @route   GET /api/v1/store-items
 * @access  Private (Requires JWT)
 */
export const getRewards = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const queryParams = req.query;

    if (!authHeader) {
      return res.status(401).json({
        status: 'fail',
        message: 'No authorization token provided.',
      });
    }

    // FIX: Use the Core API's canonical '/api/v1/store-items' route for fetching
    const response = await apiClient.get('/api/v1/store-items', {
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
 * @route   POST /api/v1/store-items/:id/purchase
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

    // FIX: Forward the purchase request to the Core API's correct route
    const response = await apiClient.post(
      `/api/v1/store-items/${id}/purchase`, // Correct endpoint name
      req.body, // Pass the request body (contains memberId from mobile client)
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