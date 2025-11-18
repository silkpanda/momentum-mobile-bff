import { Request, Response, NextFunction } from 'express';
import { apiClient } from '../lib/apiClient.js';
import { AxiosError } from 'axios';

/**
 * @desc    Get a specific Household by ID (for Profile Selection)
 * @route   GET /api/v1/household/:id
 * @access  Private (Requires JWT from mobile app)
 */
export const getHouseholdById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // 1. Get the auth token from the incoming mobile request
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: 'fail',
        message: 'No authorization token provided.',
      });
    }

    // 2. Validate ID presence
    if (!id) {
      return res.status(400).json({
        status: 'fail',
        message: 'Household ID is required.',
      });
    }

    // 3. Call the internal 'momentum-api'
    // We forward the request to the core service
    const response = await apiClient.get(`/api/v1/households/${id}`, {
      headers: {
        Authorization: authHeader,
      },
    });

    // 4. Return the household data (containing memberProfiles)
    res.status(200).json(response.data);
  } catch (error) {
    // --- Handle errors from the 'momentum-api' ---
    if (error instanceof AxiosError && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      console.error(
        `[householdController] Error fetching household ${req.params.id}:`,
        error.message,
      );
    } else {
      console.error(
        '[householdController] Unexpected unknown error:',
        error,
      );
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error in BFF.',
    });
  }
};