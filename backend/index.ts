import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Request, type Response } from "express";
import authRoutes from "./src/routes/auth.routes";
import boardRoutes from "./src/routes/board.routes";
import cardRoutes from "./src/routes/card.routes";
import { setupWebSocket } from "./src/ws/websocket";

const app = express();
const PORT = process.env.PORT ?? 5000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/cards", cardRoutes);

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "OK", message: "Backend Express Typescript are ready!" });
});

const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

setupWebSocket(server);
