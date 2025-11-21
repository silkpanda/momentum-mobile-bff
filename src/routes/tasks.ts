// src/routes/tasks.ts - Simple proxy to API
import { Router } from 'express';
import fetch from 'node-fetch';
import { API_BASE_URL } from '../utils/config';

const router = Router();

const proxyRequest = async (req: any, res: any, path: string, method: string = 'GET') => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'No authorization header' });

        const options: any = {
            method,
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
        };
        if (method !== 'GET' && req.body) options.body = JSON.stringify(req.body);

        const response = await fetch(`${API_BASE_URL}${path}`, options);

        if (response.status === 204) {
            return res.status(200).json({ success: true });
        }

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error: any) {
        res.status(500).json({ message: 'Request failed', error: error.message });
    }
};

router.get('/', (req, res) => proxyRequest(req, res, '/tasks'));
router.post('/', (req, res) => proxyRequest(req, res, '/tasks', 'POST'));
router.patch('/:id', (req, res) => proxyRequest(req, res, `/tasks/${req.params.id}`, 'PATCH'));
router.delete('/:id', (req, res) => proxyRequest(req, res, `/tasks/${req.params.id}`, 'DELETE'));
router.post('/:id/complete', (req, res) => proxyRequest(req, res, `/tasks/${req.params.id}/complete`, 'POST'));
router.post('/:id/approve', (req, res) => proxyRequest(req, res, `/tasks/${req.params.id}/approve`, 'POST'));

export default router;
