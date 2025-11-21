// src/routes/auth.ts
import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { API_BASE_URL } from '../utils/config';

const router = Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'No authorization header' });
        }

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': authHeader }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to get user', error: error.message });
    }
});

export default router;
