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
      if (
        client.readyState === WebSocket.OPEN &&
        (client as any).boardId === data.boardId
      ) {
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

  const broadcastPresence = (boardId: string) => {
    const onlineUsers: string[] = [];

    wss.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        (client as any).boardId === boardId &&
        (client as any).userEmail
      ) {
        if (!onlineUsers.includes((client as any).userEmail)) {
          onlineUsers.push((client as any).userEmail);
        }
      }
    });

    broadcast({ type: "PRESENCE_UPDATE", boardId, users: onlineUsers });
  };

  wss.on("connection", (socket: WebSocket, req: IncomingMessage) => {
    console.log("Client connected via WebSocket");

    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const boardId = url.searchParams.get("boardId");
    const email = url.searchParams.get("email");
    (socket as any).boardId = boardId;
    (socket as any).userEmail = email;

    broadcastPresence(boardId!);

    socket.on("close", () => {
      console.log("Client disconnected");
      broadcastPresence(boardId!);
    });
  });

  return wss;
};
