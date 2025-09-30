import { type Request, type Response } from 'express';
import jwt from "jsonwebtoken";
import { userController } from './userController';

class AuthController {
    /**
     * Autenticación del usuario
     */
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const users = userController.readUsers();
            const user = users.find(u => u.email === email && u.password === password);

            if (!user) return res.status(401).json({ success: false, message: "Credenciales inválidas" });

            const expire = Number(process.env.JWT_EXPIRE) || 86400;
            const token = jwt.sign({ email: user.email }, `${process.env.JWT_SECRET}`, { expiresIn: expire });
            return res.json({ success: true, token });
        } catch (error) {
            console.error('AuthController exception:', error);
            res.status(500).json({
                success: false,
                message: 'Error log in'
            });
        }
    }
};

export const authController = new AuthController();
