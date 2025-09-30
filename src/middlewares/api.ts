import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function checkApiKey(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or missing API key'
        });
    }

    return next();
}

export function checkJWT(req: Request, res: Response, next: NextFunction) {
    if (req.url === '/login') {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "No token" });
    }

    const token = authHeader.split(" ")[1] ?? '';
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string);
        (req as any).user = payload;
        return next();
    } catch {
        return res.status(401).json({ error: "Token inválido" });
    }
}