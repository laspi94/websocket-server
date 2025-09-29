import { type Request, type Response, type NextFunction } from 'express';

export function checkApiKey(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or missing API key'
        });
    }

    next();
}