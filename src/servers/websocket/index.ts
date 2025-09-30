import WebSocket from 'ws';
import { ServerConnection } from '../../types/connection';
import { event } from '../../types/message';
import { LogController } from '../../controllers';

/** Eventos  de respuesta */
const DISCONNECTED = 'disconnected';

const ERROR = 'error';

const EVENT = 'event';

const SUCCESS = 'success';

const SUBSCRIBED = 'subscribed';

const WELCOME = 'welcome';

/** Eventos de acciones */
const SUBSCRIBE = 'subscribe';

const AUTH = 'auth';

const SEND = 'send';

const PING = 'ping';

async function startWebSocketServer() {
    try {
        /**
         * Configuración del servidor WebSocket
         */
        const WEBSOCKET_PORT: number = process.env.WEBSOCKET_PORT
            ? Number(process.env.WEBSOCKET_PORT)
            : 8080;

        const AUTH_TOKEN = process.env.WEBSOCKET_TOKEN || 'your_auth_token_here';

        /**
         * Almacenar servidores y clientes conectados
         */
        const authClients = new Map<string, ServerConnection>();
        const connectedClients = new Set<ServerConnection>();

        /**
         * Crear el servidor WebSocket
         */
        const wss = new WebSocket.Server({ port: WEBSOCKET_PORT });

        console.log(`WebSocket server started on port ${WEBSOCKET_PORT}`);

        /**
         * Manejar nuevas conexiones
         */
        wss.on('connection', (ws, req) => {
            console.log('New WebSocket connection established');

            /**
             * Almacenar dirección IP para registro
             */
            const clientIp: string | undefined = req.socket.remoteAddress;

            /**
             * Manejar mensajes entrantes
             */
            ws.on('message', (event: string) => {
                try {
                    const message = JSON.parse(event);
                    handleEvent(ws, message, clientIp);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                    newEvent(ws, { Event: ERROR, Message: 'Invalid JSON format' });
                }
            });

            /**
             * Maneja el cierre de conexiones
             */
            ws.on('close', () => {
                handleDisconnect(ws, clientIp);
            });

            /**
             * Maneja errores
             */
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });

            /**
             * Envia mensaje de bienvenida
             */
            newEvent(ws, { Event: WELCOME, Message: 'Connected to WebSocket server' });
        });

        /**
         * Manejar eventos entrantes
         */
        function handleEvent(ws: WebSocket, event: event, clientIp: string | undefined) {
            switch (event.Action) {
                case AUTH:
                    handleAuth(ws, event, clientIp);
                    break;
                case SUBSCRIBE:
                    handleSuscribeChannel(ws, event);
                    break;
                case SEND:
                    handleMessage(ws, event);
                    break;
                case PING:
                    handlePingMessage(ws);
                    break;
                default:
                    console.warn('Unknown action:', event.Action);
                    newEvent(ws, { Event: ERROR, Message: 'Unknown action' });
            }
        }

        function handlePingMessage(ws: WebSocket) {
            newEvent(ws, { Message: 'pong' });
        }

        function newEvent(ws: WebSocket,
            {
                Event,
                Action,
                Message,
                Id,
                Channel,
                Sender,
                Token
            }: event
        ) {
            const event: event = {
                Event,
                Action,
                Message,
                Id,
                Channel,
                Sender,
                Token,
            };

            ws.send(JSON.stringify(event));
        }

        /**
         * Handle auth event
         */
        function handleAuth(ws: WebSocket, event: event, clientIp: string | undefined) {
            if (!event.Id || !event.Token) {
                console.warn(`Authentication failed from ${clientIp}: Missing ServerId or Token`);
                newEvent(ws, { Event: ERROR, Message: 'Missing Id or Token' });
                ws.close();
                return;
            }

            if (event.Token !== AUTH_TOKEN) {
                console.warn(`Authentication failed from ${clientIp}: Invalid token`);
                newEvent(ws, { Event: ERROR, Message: 'Invalid authentication token' });
                ws.close();
                return;
            }

            if (!event.Id) {
                newEvent(ws, { Event: ERROR, Message: 'Missing Client ID' });
                return;
            }

            /**
             * Store the authenticated server connection
             */
            const client: ServerConnection = {
                ws,
                id: event.Id,
                channels: new Set()
            };

            authClients.set(event.Id, client);
            console.log(`Conection from ${event.Id} authenticated from ${clientIp}`);

            newEvent(ws, { Event: SUCCESS, Message: 'Authentication successful' });

            connectedClients.add(client);
        }

        /**
         * Handle suscription events
         */
        function handleSuscribeChannel(ws: WebSocket, event: event) {

            const client = Array.from(connectedClients).find(c => c.ws === ws);

            if (!client) {
                newEvent(ws, { Event: ERROR, Message: 'Client not authenticated' });
                return;
            }

            if (!event.Channel) {
                newEvent(ws, { Event: ERROR, Message: 'Missing Channel' });
                return;
            }

            client.channels.add(event.Channel);

            /**
             * Notify other client to channels
             */
            connectedClients.forEach(c => {
                if (c.channels.has(event.Channel ?? '') && c.ws.readyState === WebSocket.OPEN && c.id !== client.id) {
                    newEvent(c.ws, { Event: SUBSCRIBED, Message: `Client ${client.id} connected`, Id: client.id });
                }
            });

            newEvent(ws, { Event: SUCCESS, Message: `Subscribed to channel ${event.Channel}` });
        }

        /**
         * Handle chat events from clients
         */
        function handleMessage(ws: WebSocket, event: event) {
            if (!event.Channel) {
                newEvent(ws, { Event: ERROR, Message: 'Missing Channel' });
                return;
            }

            const client = Array.from(connectedClients).find(c => c.ws === ws);

            if (!client) {
                newEvent(ws, { Event: ERROR, Message: 'Client not authenticated' });
                return;
            }

            if (!client.channels.has(event.Channel)) {
                newEvent(ws, { Event: ERROR, Message: 'You are not subscribed to this channel' });
                return;
            }

            connectedClients.forEach(c => {
                if (c.channels.has(event.Channel ?? '') && c.ws.readyState === WebSocket.OPEN && c.id !== client.id) {
                    newEvent(c.ws, { Event: EVENT, Message: event.Message, Id: client.id });
                }
            });

            LogController.register(event)
        }

        /**
         * Handle client disconnections
         * @param {*} ws 
         * @param {*} clientIp 
         */
        function handleDisconnect(ws: WebSocket, clientIp: string | undefined) {

            const client = Array.from(connectedClients).find(c => c.ws === ws);
            if (!client) {
                console.log(`Unknown client disconnected from ${clientIp}`);
                return;
            }

            console.log(`Server ${client.id} disconnected`);

            connectedClients.delete(client);

            client.channels.forEach(channel => {
                connectedClients.forEach(c => {
                    if (c.channels.has(channel) && c.ws.readyState === WebSocket.OPEN && c.id !== client.id) {
                        newEvent(c.ws, { Event: DISCONNECTED, Message: `Client ${client.id} disconnected`, Id: client.id });
                    }
                });
            });
        }

        process.on('SIGINT', () => {
            console.log('Shutting down WebSocket server...');
            wss.close(() => {
                console.log('WebSocket server closed');
                process.exit(0);
            });
        });

        return {
            wss, authClients, connectedClients
        }

    } catch (error) {
        console.error('Error starting the server:', error);
        process.exit(1);
    }
}

export {
    startWebSocketServer
}