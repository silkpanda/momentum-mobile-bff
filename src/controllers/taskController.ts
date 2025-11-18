import { Request, Response, NextFunction } from 'express';
import { apiClient } from '../lib/apiClient.js';
import { AxiosError } from 'axios';

/**
 * @desc    Mark a task as complete (Pending Approval)
 * @route   POST /api/v1/tasks/:id/complete
 * @access  Private (Requires JWT)
 */
export const completeTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // 1. Get the auth token
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
        message: 'Task ID is required.',
      });
    }

    // 2. Call the internal 'momentum-api'
    // The core API handles the logic of updating status to 'PendingApproval'
    // and triggering any notifications.
    const response = await apiClient.post(
      `/api/v1/tasks/${id}/complete`,
      {}, // Empty body for this action
      {
        headers: {
          Authorization: authHeader,
        },
      },
    );

    // 3. Return the updated task data
    res.status(200).json(response.data);
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    if (error instanceof Error) {
      console.error(
        `[taskController] Error completing task ${req.params.id}:`,
        error.message,
      );
    } else {
      console.error('[taskController] Unexpected unknown error:', error);
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error in BFF.',
    });
  }
};