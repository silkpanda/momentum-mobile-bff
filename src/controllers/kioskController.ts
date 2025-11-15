import { Request, Response, NextFunction } from 'express';
// --- THIS IS THE FIX ---
// Changed to uppercase 'C' to match the file name
import { apiClient } from '../lib/apiClient.js';
// --- END OF FIX ---
import { AxiosError } from 'axios';

/**
 * @desc    Get all data for the Kiosk View
 * @route   GET /api/v1/kiosk-data
 * @access  Private (Requires JWT from mobile app)
 */
export const getKioskData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. Get the auth token from the incoming mobile request
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: 'fail',
        message: 'No authorization token provided.',
      });
    }

    // 2. Call the internal 'momentum-api' using the token
    // We are forwarding the mobile app's token directly to the API.
    const response = await apiClient.get('/api/v1/households', {
      headers: {
        Authorization: authHeader,
      },
    });

    // 3. Send the data from the 'momentum-api' back to the mobile app
    // This is the "calm payload"
    res.status(200).json(response.data);
  } catch (error) {
    // --- Handle errors from the 'momentum-api' ---
    if (error instanceof AxiosError && error.response) {
      // If the API (e.g., /api/v1/households) sends a specific error
      // (like 401 Unauthorized, 404 Not Found),
      // forward that error to the mobile app.
      return res.status(error.response.status).json(error.response.data);
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      console.error(
        '[kioskController] Unexpected error fetching kiosk data:',
        error.message,
      );
    } else {
      console.error(
        '[kioskController] Unexpected unknown error:',
        error,
      );
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error in BFF.',
    });
  }
};