import { event } from '../../types/message';
import { LogController } from '../../controllers';
import { ResponseEvent, ActionEvent } from '../../enums';
import { ServerConnection } from '../../types/connection';
import WebSocket from 'ws';

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
                    newEvent(ws, { Event: ResponseEvent.ERROR, Message: 'Invalid JSON format' });
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
            newEvent(ws, { Event: ResponseEvent.WELCOME, Message: 'Connected to WebSocket server' });
        });

        /**
         * Manejar eventos entrantes
         */
        function handleEvent(ws: WebSocket, event: event, clientIp: string | undefined) {
            switch (event.Action) {
                case ActionEvent.AUTH:
                    handleAuth(ws, event, clientIp);
                    break;
                case ActionEvent.SUBSCRIBE:
                    handleSuscribeChannel(ws, event);
                    break;
                case ActionEvent.SEND:
                    handleMessage(ws, event);
                    break;
                case ActionEvent.PING:
                    handlePingMessage(ws);
                    break;
                default:
                    console.warn('Unknown action:', event.Action);
                    newEvent(ws, { Event: ResponseEvent.ERROR, Message: 'Unknown action' });
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
         * Maneja eventos de autenticación
         */
        function handleAuth(ws: WebSocket, event: event, clientIp: string | undefined) {
            if (!event.Id || !event.Token) {
                console.warn(`Authentication failed from ${clientIp}: Missing ServerId or Token`);
                newEvent(ws, { Event: ResponseEvent.ERROR, Message: 'Missing Id or Token' });
                ws.close();
                return;
            }

            if (event.Token !== AUTH_TOKEN) {
                console.warn(`Authentication failed from ${clientIp}: Invalid token`);
                newEvent(ws, { Event: ResponseEvent.ERROR, Message: 'Invalid authentication token' });
                ws.close();
                return;
            }

            if (!event.Id) {
                newEvent(ws, { Event: ResponseEvent.ERROR, Message: 'Missing Client ID' });
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

            newEvent(ws, { Event: ResponseEvent.AUTHENTICATED, Message: 'Authentication successful' });

            connectedClients.add(client);
        }

        /**
         * Maneja eventos de subscripción
         */
        function handleSuscribeChannel(ws: WebSocket, event: event) {

            const client = Array.from(connectedClients).find(c => c.ws === ws);

            if (!client) {
                newEvent(ws, { Event: ResponseEvent.ERROR, Message: 'Client not authenticated' });
                return;
            }

            if (!event.Channel) {
                newEvent(ws, { Event: ResponseEvent.ERROR, Message: 'Missing Channel' });
                return;
            }

            client.channels.add(event.Channel);

            /**
             * Notifica a los clientes en sus canales
             */
            connectedClients.forEach(c => {
                if (c.channels.has(event.Channel ?? '') && c.ws.readyState === WebSocket.OPEN && c.id !== client.id) {
                    newEvent(c.ws, { Event: ResponseEvent.SUBSCRIBED, Message: `Client ${client.id} connected`, Id: client.id });
                }
            });

            newEvent(ws, { Event: ResponseEvent.SUCCESS, Message: `Subscribed to channel ${event.Channel}` });
        }

        /**
         * Maneja los eventos de los clientes conectados
         */
        function handleMessage(ws: WebSocket, event: event) {
            if (!event.Channel) {
                newEvent(ws, { Event: ResponseEvent.ERROR, Message: 'Missing Channel' });
                return;
            }

            const client = Array.from(connectedClients).find(c => c.ws === ws);

            if (!client) {
                newEvent(ws, { Event: ResponseEvent.ERROR, Message: 'Client not authenticated' });
                return;
            }

            if (!client.channels.has(event.Channel)) {
                newEvent(ws, { Event: ResponseEvent.ERROR, Message: 'You are not subscribed to this channel' });
                return;
            }

            connectedClients.forEach(c => {
                if (c.channels.has(event.Channel ?? '') && c.ws.readyState === WebSocket.OPEN && c.id !== client.id) {
                    newEvent(c.ws, { Event: ResponseEvent.EVENT, Message: event.Message, Id: client.id, Sender: event.Sender });
                }
            });

            LogController.register(event)
        }

        /**
         * Maneja la desconexión de los clientes
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
                        newEvent(c.ws, { Event: ResponseEvent.DISCONNECTED, Message: `Client ${client.id} disconnected`, Id: client.id });
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