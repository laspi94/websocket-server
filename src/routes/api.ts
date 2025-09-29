import express from 'express';
import { authController } from '../controllers/authController';

export function apiRoutes() {
    const router = express.Router();
    router.use(express.json());

    /**
     * Auth
     */
    router.post('/login', authController.login);

    return router;
}