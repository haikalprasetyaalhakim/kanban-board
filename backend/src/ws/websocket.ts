import type { IncomingMessage, Server, ServerResponse } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { subClient } from "../config/redis";

export const setupWebSocket = (
  server: Server<typeof IncomingMessage, typeof ServerResponse>,
) => {
  const wss = new WebSocketServer({ server });

  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  subClient.subscribe("kanban-events");
  subClient.on("message", (channel, message) => {
    if (channel === "kanban-events") {
      const data = JSON.parse(message);
      broadcast(data);
    }
  });

  wss.on("connection", (socket: WebSocket) => {
    console.log("Client connected via WebSocket");

    socket.on("close", () => {
      console.log("Client disconnected");
    });
  });

  return wss;
};
