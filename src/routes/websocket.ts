import { Router, type Request, type Response } from "express";
import { ServerConnection, WebSocketRoutesOptions } from "../types";
import { LogController, messageController } from "../controllers";
import { ResponseEvent } from "../enums";

export function websocketRoutes({ connectedClients, authClients }: WebSocketRoutesOptions) {
    const router = Router();

    /**
     * Recupera los clientes conectados
     */
    router.get("/clients", (req: Request, res: Response) => {
        res.json({
            total: connectedClients.size,
            clients: Array.from(authClients.keys())
        });
    });

    /**
     * Recupera los clientes conectados a un canal específico
     */
    router.get("/clients/by-channel", (req: Request, res: Response) => {
        const channel = req.query.channel as string;
        if (!channel) {
            return res.status(400).json({ error: "Missing channel parameter" });
        }

        const clientsInChannel: string[] = [];

        connectedClients.forEach((client: ServerConnection) => {
            if (client.channels.has(channel)) {
                const clientId = authClients.has(client.id) ? client.id : client.id;
                clientsInChannel.push(clientId);
            }
        });

        res.json({
            channel,
            total: clientsInChannel.length,
            clients: clientsInChannel,
        });
    });

    /**
     * Recupera los canales existentes
     */
    router.get("/channels", (req: Request, res: Response) => {
        const channels = new Set<string>();
        connectedClients.forEach(client => {
            client.channels.forEach(ch => channels.add(ch));
        });
        res.json({ channels: Array.from(channels) });
    });

    /**
     * Recupera historial de eventos de un canal
     */
    router.get('/channel/events', messageController.getByChannel);

    /**
     * Emite un evento a un canal específico
     */
    router.post("/broadcast", (req: Request, res: Response) => {
        const channel = req.query.channel as string;
        if (!channel) {
            return res.status(400).json({ error: "Missing channel parameter" });
        }

        const message = req.query.message as string;
        if (!message) {
            return res.status(400).json({ error: "Missing message parameter" });
        }

        const id = req.query.id as string;
        if (!id) {
            return res.status(400).json({ error: "Missing id parameter" });
        }

        const sender = req.query.sender as string;
        if (!sender) {
            return res.status(400).json({ error: "Missing sender parameter" });
        }

        const event = { Event: ResponseEvent.EVENT, Message: message, Id: id, Sender: sender };
        let send = 0;
        connectedClients.forEach(client => {
            if (client.channels.has(channel) && client.ws.readyState === 1) {
                client.ws.send(JSON.stringify(event));
                send++;
            }
        });

        LogController.register(event)

        res.json({ success: true, send });
    });


    return router;
}
