import { ServerConnection } from "./connection";

export type WebSocketRoutesOptions = {
    connectedClients: Set<ServerConnection>;
    authClients: Map<string, ServerConnection>;
}
