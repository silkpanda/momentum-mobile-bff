import { Request, Response } from 'express';
import { apiClient } from '../lib/apiClient.js';
import { AxiosError } from 'axios';

/**
 * @desc    Proxy Login Request to Core API
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    // 1. Forward the email/password to the Core API
    // The Core API expects { email, password } in the body
    const response = await apiClient.post('/api/v1/auth/login', req.body);

    // 2. Return the token and user data directly to the mobile app
    // The Core API returns: { status: 'success', token, data: { ... } }
    res.status(200).json(response.data);

  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      // Forward the exact error from the Core API (e.g., "Incorrect email")
      return res.status(error.response.status).json(error.response.data);
    }

    console.error('[BFF Auth] Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error during login proxy.',
    });
  }
};