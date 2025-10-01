/** Eventos de respuesta */
export enum ResponseEvent {
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
