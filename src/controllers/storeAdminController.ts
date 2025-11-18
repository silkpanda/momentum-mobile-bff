import { Request, Response } from 'express';
import { apiClient } from '../lib/apiClient.js';
import { AxiosError } from 'axios';

const handleAdminError = (error: unknown, res: Response, context: string) => {
  if (error instanceof AxiosError && error.response) {
    return res.status(error.response.status).json(error.response.data);
  }
  console.error(`[storeAdminController] Error ${context}:`, error);
  res.status(500).json({ status: 'error', message: 'Internal Server Error.' });
};

export const createStoreItem = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ status: 'fail', message: 'No token.' });

    const response = await apiClient.post('/api/v1/store-items', req.body, {
      headers: { Authorization: authHeader },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    handleAdminError(error, res, 'creating store item');
  }
};

export const updateStoreItem = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const { id } = req.params;
    if (!authHeader) return res.status(401).json({ status: 'fail', message: 'No token.' });

    const response = await apiClient.patch(`/api/v1/store-items/${id}`, req.body, {
      headers: { Authorization: authHeader },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    handleAdminError(error, res, `updating store item ${req.params.id}`);
  }
};

export const deleteStoreItem = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const { id } = req.params;
    if (!authHeader) return res.status(401).json({ status: 'fail', message: 'No token.' });

    const response = await apiClient.delete(`/api/v1/store-items/${id}`, {
      headers: { Authorization: authHeader },
    });
    res.sendStatus(response.status);
  } catch (error) {
    handleAdminError(error, res, `deleting store item ${req.params.id}`);
  }
};