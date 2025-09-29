import { type Request, type Response } from 'express';
import { LogController } from '../logController';

class MessageController {
    /**
     * Obtiene chat desde logs por serverId
     */
    async getByChannel(req: Request, res: Response) {
        try {
            const channel: string = req.query.channel as string || '';
            const messages = LogController.getMessagesFromFile(channel);

            res.json(messages);
        } catch (error) {
            console.error('MessageController exception:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting channel message history'
            });
        }
    }
};

export const messageController = new MessageController();