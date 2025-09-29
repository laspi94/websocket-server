
import fs from "fs";
import path from "path";
import { User } from "../types";

const directory = 'db';

class UserController {
    dbPath: string

    constructor() {
        this.dbPath = path.join(process.cwd(), directory, "users.json");
    }


    /**
     * Crea el archivo users.json con array vacío si no existe
     */
    private ensureFileExists() {
        if (!fs.existsSync(this.dbPath)) {
            if (!fs.existsSync(path.dirname(this.dbPath))) {
                fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
            }

            fs.writeFileSync(this.dbPath, JSON.stringify({ users: [] }, null, 2));
        }
    }

    /**
     *  Función para leer usuarios
     */
    readUsers(): User[] {
        this.ensureFileExists()
        const data = fs.readFileSync(this.dbPath, "utf-8");
        return JSON.parse(data).users;
    };

    /**
     * Función para guardar usuarios
     */
    saveUsers(users: User[]) {
        this.ensureFileExists()
        fs.writeFileSync(this.dbPath, JSON.stringify({ users }, null, 2));
    };
}

export const userController = new UserController();