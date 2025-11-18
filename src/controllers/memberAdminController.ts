import { Request, Response } from 'express';
import { apiClient } from '../lib/apiClient.js'
import { AxiosError } from 'axios';

const handleAdminError = (error: unknown, res: Response, context: string) => {
  if (error instanceof AxiosError && error.response) {
    return res.status(error.response.status).json(error.response.data);
  }
  console.error(`[memberAdminController] Error ${context}:`, error);
  res.status(500).json({ status: 'error', message: 'Internal Server Error.' });
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const { id } = req.params; // Household ID
    if (!authHeader) return res.status(401).json({ status: 'fail', message: 'No token.' });

    const response = await apiClient.post(`/api/v1/households/${id}/members`, req.body, {
      headers: { Authorization: authHeader },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    handleAdminError(error, res, 'adding member');
  }
};

export const updateMember = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const { id, memberId } = req.params;
    if (!authHeader) return res.status(401).json({ status: 'fail', message: 'No token.' });

    const response = await apiClient.patch(`/api/v1/households/${id}/members/${memberId}`, req.body, {
      headers: { Authorization: authHeader },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    handleAdminError(error, res, 'updating member');
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const { id, memberId } = req.params;
    if (!authHeader) return res.status(401).json({ status: 'fail', message: 'No token.' });

    const response = await apiClient.delete(`/api/v1/households/${id}/members/${memberId}`, {
      headers: { Authorization: authHeader },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    handleAdminError(error, res, 'removing member');
  }
};