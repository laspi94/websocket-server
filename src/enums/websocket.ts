/** Eventos de respuesta */
export enum ResponseEvent {
    AUTHENTICATED = "authenticated",
    DISCONNECTED = "disconnected",
    ERROR = "error",
    EVENT = "event",
    SUCCESS = "success",
    SUBSCRIBED = "subscribed",
    WELCOME = "welcome",
}

/** Eventos de acciones */
export enum ActionEvent {
    SUBSCRIBE = "subscribe",
    AUTH = "auth",
    SEND = "send",
    PING = "ping",
}
