import express from 'express';
import cors from "cors";
import dotenv from "dotenv";
import { startWebSocketServer } from '../websocket';
import { apiRoutes, websocketRoutes } from '../../routes';
import { Middlewares } from '../../middlewares/kernel';

function init() {
    const app = express();
    app.use(express.json());
    app.use(cors({
        origin: process.env.FRONTEND_DOMAIN || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }));
    return app;
}

export async function startServer() {
    try {
        /** Cargar .env */
        dotenv.config();
        const app = init();

        /**
         * Rutas API
         */
        const { authClients, wss, connectedClients } = await startWebSocketServer();
        app.use("/api", Middlewares.api, [apiRoutes(), websocketRoutes({ authClients, connectedClients })]);

        /**
         * Iniciar servidor http
         */
        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

        /**
         * Manejar el apagado del servidor
         */
        process.on('SIGINT', () => {
            console.log('Shutting down servers...');
            server.close(() => {
                console.log('Server closed');
            });
        });
    } catch (error) {
        console.error('Error on initialized server:', error);
        process.exit(1);
    }
}
