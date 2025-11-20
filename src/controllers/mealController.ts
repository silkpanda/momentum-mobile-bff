import { Request, Response } from 'express';
import { apiClient } from '../lib/apiClient.js';

// --- RECIPES ---

export const getRecipes = async (req: Request, res: Response) => {
    try {
        const response = await apiClient.get('/api/v1/meals/recipes', {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Get Recipes Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const createRecipe = async (req: Request, res: Response) => {
    try {
        const response = await apiClient.post('/api/v1/meals/recipes', req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Create Recipe Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const updateRecipe = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const response = await apiClient.put(`/api/v1/meals/recipes/${id}`, req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Update Recipe Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const deleteRecipe = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const response = await apiClient.delete(`/api/v1/meals/recipes/${id}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Delete Recipe Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

// --- RESTAURANTS ---

export const getRestaurants = async (req: Request, res: Response) => {
    try {
        const response = await apiClient.get('/api/v1/meals/restaurants', {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Get Restaurants Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const createRestaurant = async (req: Request, res: Response) => {
    try {
        console.log('[BFF] Create Restaurant - Request Body:', JSON.stringify(req.body, null, 2));
        const response = await apiClient.post('/api/v1/meals/restaurants', req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Create Restaurant Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const updateRestaurant = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const response = await apiClient.put(`/api/v1/meals/restaurants/${id}`, req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Update Restaurant Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const deleteRestaurant = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const response = await apiClient.delete(`/api/v1/meals/restaurants/${id}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Delete Restaurant Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

// --- MEAL PLANS ---

export const getMealPlans = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const response = await apiClient.get('/api/v1/meals/plans', {
            headers: { Authorization: req.headers.authorization },
            params: { startDate, endDate }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Get Meal Plans Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const createMealPlan = async (req: Request, res: Response) => {
    try {
        const response = await apiClient.post('/api/v1/meals/plans', req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Create Meal Plan Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const deleteMealPlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const response = await apiClient.delete(`/api/v1/meals/plans/${id}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('[BFF] Delete Meal Plan Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};
