import WebSocket from 'ws';

export type ServerConnection = {
    ws: WebSocket;
    id: string;
    channels: Set<string>;
}