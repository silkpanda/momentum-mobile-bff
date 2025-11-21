// src/routes/members.ts
import { Router } from 'express';
import fetch from 'node-fetch';
import { API_BASE_URL } from '../utils/config';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ message: 'No authorization' });

        const response = await fetch(`${API_BASE_URL}/households/me`, {
            headers: { 'Authorization': auth }
        });

        const data: any = await response.json();
        res.json({ memberProfiles: data.data?.household?.memberProfiles || [] });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch members', error: error.message });
    }
});

export default router;
