import { Request, Response } from 'express';
import { apiClient } from '../lib/apiClient.js';

export const createRoutine = async (req: Request, res: Response) => {
    try {
        const response = await apiClient.post('/api/v1/routines', req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Create Routine Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const getAllRoutines = async (req: Request, res: Response) => {
    try {
        const response = await apiClient.get('/api/v1/routines', {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Get All Routines Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const getMemberRoutines = async (req: Request, res: Response) => {
    try {
        const { memberId } = req.params;
        const response = await apiClient.get(`/api/v1/routines/member/${memberId}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Get Member Routines Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const updateRoutine = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const response = await apiClient.put(`/api/v1/routines/${id}`, req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Update Routine Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const deleteRoutine = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const response = await apiClient.delete(`/api/v1/routines/${id}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Delete Routine Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const completeRoutine = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const response = await apiClient.post(`/api/v1/routines/${id}/complete`, req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Complete Routine Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};
