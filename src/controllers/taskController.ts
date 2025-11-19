import { Request, Response, NextFunction } from 'express';
import { apiClient } from '../lib/apiClient.js';
import { AxiosError } from 'axios';

/**
 * @desc    Mark a task as complete (Pending Approval)
 * @route   POST /api/v1/tasks/:id/complete
 */
export const completeTask = async (
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
        message: 'Task ID is required.',
      });
    }

    // Forward body (contains memberId) to Core API
    const response = await apiClient.post(
      `/api/v1/tasks/${id}/complete`,
      req.body,
      {
        headers: {
          Authorization: authHeader,
        },
      },
    );

    res.status(200).json(response.data);
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    console.error(`[taskController] Error completing task:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error in BFF.',
    });
  }
};

/**
 * @desc    Get all tasks for the household
 * @route   GET /api/v1/tasks
 */
export const getTasks = async (
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

    // Call Core API to get tasks
    const response = await apiClient.get('/api/v1/tasks', {
      headers: {
        Authorization: authHeader,
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    console.error('[taskController] Error fetching tasks:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error in BFF.',
    });
  }
};