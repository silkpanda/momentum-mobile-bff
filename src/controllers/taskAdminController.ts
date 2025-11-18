import { Request, Response } from 'express';
import { apiClient } from '../lib/apiClient.js'; // <-- Corrected Path
import { AxiosError } from 'axios';

// Helper to forward errors
const handleAdminError = (error: unknown, res: Response, context: string) => {
  if (error instanceof AxiosError && error.response) {
    return res.status(error.response.status).json(error.response.data);
  }
  console.error(`[taskAdminController] Error ${context}:`, error);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error in BFF Admin Layer.',
  });
};

/**
 * @desc    Create a new task (Parent Only)
 * @route   POST /api/v1/admin/tasks
 */
export const createTask = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ status: 'fail', message: 'No token provided.' });
    }

    const response = await apiClient.post('/api/v1/tasks', req.body, {
      headers: { Authorization: authHeader },
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    handleAdminError(error, res, 'creating task');
  }
};

/**
 * @desc    Update a task
 * @route   PUT /api/v1/admin/tasks/:id
 */
export const updateTask = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const { id } = req.params;
    
    if (!authHeader) {
      return res.status(401).json({ status: 'fail', message: 'No token provided.' });
    }

    const response = await apiClient.patch(`/api/v1/tasks/${id}`, req.body, {
      headers: { Authorization: authHeader },
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    handleAdminError(error, res, `updating task ${req.params.id}`);
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/v1/admin/tasks/:id
 */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const { id } = req.params;
    
    if (!authHeader) {
      return res.status(401).json({ status: 'fail', message: 'No token provided.' });
    }

    const response = await apiClient.delete(`/api/v1/tasks/${id}`, {
      headers: { Authorization: authHeader },
    });
    
    res.sendStatus(response.status);
  } catch (error) {
    handleAdminError(error, res, `deleting task ${req.params.id}`);
  }
};

/**
 * @desc    Get ONLY tasks pending approval (for the Parent Queue)
 * @route   GET /api/v1/admin/tasks/pending
 */
export const getPendingTasks = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ status: 'fail', message: 'No token provided.' });
    }

    const response = await apiClient.get('/api/v1/tasks', {
      headers: { Authorization: authHeader },
    });

    // Filter locally for 'PendingApproval' status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allTasks = response.data.data?.tasks || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pendingTasks = allTasks.filter((t: any) => t.status === 'PendingApproval');

    res.status(200).json({
      status: 'success',
      results: pendingTasks.length,
      data: { tasks: pendingTasks },
    });
  } catch (error) {
    handleAdminError(error, res, 'fetching pending tasks');
  }
};

/**
 * @desc    Approve a task (Release Points)
 * @route   POST /api/v1/admin/tasks/:id/approve
 */
export const approveTask = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const { id } = req.params;
    
    if (!authHeader) {
      return res.status(401).json({ status: 'fail', message: 'No token provided.' });
    }

    const response = await apiClient.post(`/api/v1/tasks/${id}/approve`, {}, {
      headers: { Authorization: authHeader },
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    handleAdminError(error, res, `approving task ${req.params.id}`);
  }
};