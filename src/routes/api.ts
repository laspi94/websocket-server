import express, { type Request, type Response } from 'express';
import { ChatController } from '../controllers';

export function apiRoutes() {
    const router = express.Router();
    router.use(express.json());

    /**
     * Rutas para información del servidor
     */
    router.get('/channel/history', ChatController.getByChannel);

    return router;
}