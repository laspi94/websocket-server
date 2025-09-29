# WebSocket Server

Servidor WebSocket para comunicación en tiempo real con soporte de autenticación y canales múltiples. Este README describe cómo interactuar con el servidor y las propiedades requeridas para cada tipo de evento.

---

## Configuración

El servidor utiliza las siguientes variables de entorno:

| Variable                     | Descripción                                      | Valor por defecto       |
|-------------------------------|-------------------------------------------------|------------------------|
| `WEBSOCKET_PORT`       | Puerto en el que se ejecutará el servidor       | `8080`                 |
| `WEBSOCKET_TOKEN`      | Token de autenticación para clientes            | `'your_auth_token_here'` |

---

## Estructura del Cliente

Cada cliente conectado se representa con el siguiente objeto:

```ts
interface ServerConnection {
  ws: WebSocket;                // Conexión WebSocket del cliente
  id: string;                   // Identificador único del cliente
  channels: Set<string>;        // Canales a los que está suscrito
}
```

## Eventos Disponibles

Los clientes pueden enviar eventos JSON al servidor con la propiedad Action para especificar la acción.

1. auth – Autenticación

Autentica al cliente con el servidor.

Propiedades requeridas:

```json
{
  "Action": "auth",
  "Id": "string",               // ID único del cliente
  "Token": "string"             // Token de autenticación
}
```

Respuestas posibles:

+ success: Autenticación correcta
+ error: Faltan propiedades o token inválido

2. suscribe – Suscribirse a un canal

Permite que el cliente se suscriba a un canal específico. Un cliente puede suscribirse a múltiples canales.

Propiedades requeridas:
```json
{
  "Action": "suscribe",
  "Channel": "string"   // Nombre del canal
}
```

Respuestas:
+ success: Confirmación de suscripción
+ error: Cliente no autenticado o falta el canal
+ suscribed: Notificación a otros clientes del canal sobre la nueva suscripción

3. send – Enviar un mensaje a un canal

Envía un mensaje a todos los clientes conectados que estén suscritos al mismo canal.

Propiedades requeridas:
```json
{
  "Action": "send",
  "Channel": "string",  // Canal al que se enviará el mensaje
  "Message": "string"   // Contenido del mensaje
}
```

Respuestas:
+ event: Mensaje enviado a otros clientes del canal
+ error: Cliente no autenticado o no suscrito al canal

4. ping – Ping de conexión

Permite al cliente comprobar si la conexión sigue activa.

Propiedades requeridas:
```json
{
  "Action": "ping"
}
```

Respuesta:
```json
{
  "Event": "pong"
}
```

Notificaciones desde el Servidor

El servidor puede enviar notificaciones a los clientes en función de las acciones de otros usuarios:

Evento	Descripción
welcome	Mensaje enviado al conectar al servidor
success	Confirmación de autenticación o suscripción
error	Errores en autenticación, suscripción o envío de mensajes
suscribed	Otro cliente se ha suscrito a un canal compartido
event	Mensaje enviado a un canal
disconnected	Notificación de que un cliente se desconectó

Formato general del evento:

{
  "Action": "string",      // Tipo de evento
  "Message": "string",     // Mensaje o información asociada
  "Channel": "string",     // Canal afectado (opcional)
  "Id": "string",          // ID del cliente (opcional)
  "Sender": "string",        // Nombre de jugador (opcional)
  "Token": "string"        // Token (opcional)
}

## Flujo de Conexión

1. Cliente se conecta al servidor WebSocket.

2. Recibe mensaje welcome.

3. Envía evento auth con ID y Token.

4. Si la autenticación es exitosa, puede:

 - Suscribirse a uno o varios canales con suscribe.

 - Enviar mensajes con send.

 - Puede recibir notificaciones de otros clientes conectados al mismo canal.

5. Al desconectarse, se notifica a los clientes de los canales compartidos con disconnected.
