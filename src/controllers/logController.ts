
import fs from 'fs';
import path from 'path';
import { event } from '../types';

const directory = 'channels';

class Logger {
    /**
     * Registra un nuevo log 
     */
    register(event: event) {
        try {
            const now = new Date();

            const fecha = now.toISOString().split('T')[0];

            const fileName = `${event.Channel}_${fecha}.json`;
            const filePath = path.join(process.cwd(), directory, fileName);

            const time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;

            const logEntry = {
                Sender: event.Sender,
                Message: event.Message,
                TimeStamp: time
            };

            this.checkFileExist(filePath);

            let logs = [];

            if (fs.existsSync(filePath)) {
                const rawData = fs.readFileSync(filePath, 'utf-8');
                try {
                    logs = JSON.parse(rawData);
                } catch (e) {
                    logs = [];
                }
            }

            logs.push(logEntry);

            fs.writeFileSync(filePath, JSON.stringify(logs, null, 2), 'utf-8');
        } catch (error) {
            console.error('Ocurrió un error al registra el log:', error);
        }
    }

    /**
     * Verifica que exista el directorio de logs
     */
    checkFileExist(filePath: string) {
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
    }

    /**
     * Recupera el historial de mensajes de un canal
     */
    getMessagesFromFile(channel: string, fecha?: string) {
        try {
            if (!fecha) {
                fecha = new Date().toISOString().split('T')[0];
            }

            const fileName = `${channel}_${fecha}.json`;
            const filePath = path.join(process.cwd(), directory, fileName);

            if (!fs.existsSync(filePath)) {
                return [];
            }

            const rawData = fs.readFileSync(filePath, 'utf-8');

            try {
                return JSON.parse(rawData);
            } catch (e) {
                console.error(`Error parsing JSON from ${fileName}:`, e);
                return [];
            }

        } catch (error) {
            console.error('Error getting channel message history:', error);
            return [];
        }
    }
}

const LogController = new Logger();

export {
    LogController
}
