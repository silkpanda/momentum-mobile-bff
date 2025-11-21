// src/routes/store.ts
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

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error: any) {
        res.status(500).json({ message: 'Request failed', error: error.message });
    }
};

router.get('/', (req, res) => proxy(req, res, '/store-items'));
router.post('/', (req, res) => proxy(req, res, '/store-items', 'POST'));
router.patch('/:id', (req, res) => proxy(req, res, `/store-items/${req.params.id}`, 'PATCH'));
router.delete('/:id', (req, res) => {
    console.log('[BFF Store] DELETE request for item:', req.params.id);
    return proxy(req, res, `/store-items/${req.params.id}`, 'DELETE');
});
router.post('/:id/purchase', (req, res) => proxy(req, res, `/store-items/${req.params.id}/purchase`, 'POST'));

export default router;
