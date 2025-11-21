// src/routes/quests.ts
import { Router } from 'express';
import fetch from 'node-fetch';
import { API_BASE_URL } from '../utils/config';

const router = Router();

const proxy = async (req: any, res: any, path: string, method: string = 'GET') => {
    try {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ message: 'No authorization' });
        const opts: any = { method, headers: { 'Authorization': auth, 'Content-Type': 'application/json' } };
        if (method !== 'GET' && req.body) opts.body = JSON.stringify(req.body);
        const response = await fetch(`${API_BASE_URL}${path}`, opts);

        if (response.status === 204) {
            return res.status(200).json({ success: true });
        }

        res.status(response.status).json(await response.json());
    } catch (error: any) {
        res.status(500).json({ message: 'Request failed', error: error.message });
    }
};

router.get('/', (req, res) => proxy(req, res, '/quests'));
router.post('/', (req, res) => proxy(req, res, '/quests', 'POST'));
router.put('/:id', (req, res) => proxy(req, res, `/quests/${req.params.id}`, 'PUT'));
router.delete('/:id', (req, res) => proxy(req, res, `/quests/${req.params.id}`, 'DELETE'));
router.post('/:id/claim', (req, res) => proxy(req, res, `/quests/${req.params.id}/claim`, 'POST'));
router.post('/:id/complete', (req, res) => proxy(req, res, `/quests/${req.params.id}/complete`, 'POST'));
router.post('/:id/approve', (req, res) => proxy(req, res, `/quests/${req.params.id}/approve`, 'POST'));

export default router;
