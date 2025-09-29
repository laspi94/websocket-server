import { Router, type Request, type Response } from "express";
import { WebSocketRoutesOptions } from "../types";

export function websocketRoutes({ connectedClients, authClients }: WebSocketRoutesOptions) {
    const router = Router();

    router.get("/clients", (req: Request, res: Response) => {
        res.json({
            total: connectedClients.size,
            clients: Array.from(authClients.keys())
        });
    });

    router.get("/channels", (req: Request, res: Response) => {
        const channels = new Set<string>();
        connectedClients.forEach(client => {
            client.channels.forEach(ch => channels.add(ch));
        });
        res.json({ channels: Array.from(channels) });
    });

    router.post("/broadcast", (req: Request, res: Response) => {
        const { channel, message } = req.body;
        if (!channel || !message) {
            return res.status(400).json({ error: "Missing channel or message" });
        }

        let send = 0;
        connectedClients.forEach(client => {
            if (client.channels.has(channel) && client.ws.readyState === 1) {
                client.ws.send(JSON.stringify({ Action: "event", Channel: channel, Message: message }));
                send++;
            }
        });

        res.json({ success: true, send });
    });

    return router;
}
