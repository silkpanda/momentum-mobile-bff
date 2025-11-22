// src/routes/meals.ts
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
        res.status(response.status).json(await response.json());
    } catch (error: any) {
        res.status(500).json({ message: 'Request failed', error: error.message });
    }
};

// Restaurants
router.get('/restaurants', (req, res) => proxy(req, res, '/api/v1/meals/restaurants'));
router.post('/restaurants', (req, res) => proxy(req, res, '/api/v1/meals/restaurants', 'POST'));
router.put('/restaurants/:id', (req, res) => proxy(req, res, `/api/v1/meals/restaurants/${req.params.id}`, 'PUT'));
router.delete('/restaurants/:id', (req, res) => proxy(req, res, `/api/v1/meals/restaurants/${req.params.id}`, 'DELETE'));

// Meals (Recipes)
router.get('/meals', (req, res) => proxy(req, res, '/api/v1/meals/recipes'));
router.post('/meals', (req, res) => proxy(req, res, '/api/v1/meals/recipes', 'POST'));
router.put('/meals/:id', (req, res) => proxy(req, res, `/api/v1/meals/recipes/${req.params.id}`, 'PUT'));
router.delete('/meals/:id', (req, res) => proxy(req, res, `/api/v1/meals/recipes/${req.params.id}`, 'DELETE'));

export default router;
