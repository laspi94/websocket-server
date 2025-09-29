import { type Request, type Response } from 'express';
import { LogController } from '../logController';

const ChatController = {
    /**
     * Obtiene chat desde logs por serverId
     */
    getByChannel: async (req: Request, res: Response) => {
        try {
            const channel: string = req.query.channel as string || '';
            const chat = LogController.getMessagesFromFile(channel);

            res.json(chat);
        } catch (error) {
            console.error('ChatController exception:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting channel message history'
            });
        }
    }
};

export {
    ChatController
}