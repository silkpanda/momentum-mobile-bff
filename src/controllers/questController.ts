import { Request, Response } from 'express';
import { apiClient } from '../lib/apiClient.js';
import { AxiosError } from 'axios';

// Helper to forward errors
const handleBFFError = (error: unknown, res: Response, context: string) => {
    if (error instanceof AxiosError && error.response) {
        return res.status(error.response.status).json(error.response.data);
    }
    console.error(`[questController] Error ${context}:`, error);
    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error in BFF Layer.',
    });
};

/**
 * @desc    Get all quests
 * @route   GET /api/v1/quests
 */
export const getAllQuests = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ status: 'fail', message: 'No token provided.' });
        }

        const response = await apiClient.get('/api/v1/quests', {
            headers: { Authorization: authHeader },
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        handleBFFError(error, res, 'fetching quests');
    }
};

/**
 * @desc    Create a new quest
 * @route   POST /api/v1/admin/quests
 */
export const createQuest = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ status: 'fail', message: 'No token provided.' });
        }

        const response = await apiClient.post('/api/v1/quests', req.body, {
            headers: { Authorization: authHeader },
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        handleBFFError(error, res, 'creating quest');
    }
};

/**
 * @desc    Delete a quest
 * @route   DELETE /api/v1/admin/quests/:id
 */
export const deleteQuest = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        const { id } = req.params;

        if (!authHeader) {
            return res.status(401).json({ status: 'fail', message: 'No token provided.' });
        }

        const response = await apiClient.delete(`/api/v1/quests/${id}`, {
            headers: { Authorization: authHeader },
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        handleBFFError(error, res, `deleting quest ${req.params.id}`);
    }
};

/**
 * @desc    Claim a quest
 * @route   POST /api/v1/quests/:id/claim
 */
export const claimQuest = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        const { id } = req.params;

        if (!authHeader) {
            return res.status(401).json({ status: 'fail', message: 'No token provided.' });
        }

        const response = await apiClient.post(`/api/v1/quests/${id}/claim`, req.body, {
            headers: { Authorization: authHeader },
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        handleBFFError(error, res, `claiming quest ${req.params.id}`);
    }
};

/**
 * @desc    Complete a quest
 * @route   POST /api/v1/quests/:id/complete
 */
export const completeQuest = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        const { id } = req.params;

        if (!authHeader) {
            return res.status(401).json({ status: 'fail', message: 'No token provided.' });
        }

        const response = await apiClient.post(`/api/v1/quests/${id}/complete`, req.body, {
            headers: { Authorization: authHeader },
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        handleBFFError(error, res, `completing quest ${req.params.id}`);
    }
};

/**
 * @desc    Approve a quest
 * @route   POST /api/v1/admin/quests/:id/approve
 */
export const approveQuest = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        const { id } = req.params;

        if (!authHeader) {
            return res.status(401).json({ status: 'fail', message: 'No token provided.' });
        }

        const response = await apiClient.post(`/api/v1/quests/${id}/approve`, req.body, {
            headers: { Authorization: authHeader },
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        handleBFFError(error, res, `approving quest ${req.params.id}`);
    }
};
