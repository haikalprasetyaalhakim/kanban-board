import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { prisma } from "./prisma/client";
import { WebSocketServer, WebSocket } from "ws";

const app = express();
const PORT = 5000;
const JWT_SECRET = Bun.env.JWT_SECRET!;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Access denied: Token not found" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Access denied: Token is invalid" });
  }
};

app.get("/api/me", requireAuth, (req: Request, res: Response) => {
  res.json({
    message: "Yuhuuu",
    user: (req as any).user,
  });
});

const users: any[] = [];

app.post("/api/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  res.status(201).json({
    message: "Register successfully",
    user,
  });
});

app.post("/api/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ message: "Email or password are invalid" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Email or password are invalid" });
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "1h",
  });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 3600000,
  });

  return res.json({
    message: "Login successfully",
    user: { id: user.id, email: user.email },
  });
});

app.post("/api/logout", (req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ message: "Logout successfully" });
});

app.get("/api/boards", requireAuth, async (req: Request, res: Response) => {
  const { userId } = (req as any).user;

  let board = await prisma.board.findFirst({
    where: { userId },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: {
          cards: { orderBy: { position: "asc" } },
        },
      },
    },
  });

  if (!board) {
    board = await prisma.board.create({
      data: {
        userId,
        title: "My Kanban Board",
        columns: {
          create: [
            {
              position: 0,
              title: "To Do",
            },
            {
              position: 1,
              title: "In Progress",
            },
            {
              position: 3,
              title: "Done",
            },
          ],
        },
      },
      include: {
        columns: {
          orderBy: { position: "asc" },
          include: {
            cards: { orderBy: { position: "asc" } },
          },
        },
      },
    });
  }

  res.json(board);
});

app.post("/api/cards", requireAuth, async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const { columnId, title, description } = req.body;

  if (!columnId || !title) {
    return res.status(400).json({ message: "columnId and title required" });
  }

  const isMine = await prisma.user.findFirst({
    where: {
      id: userId,
      boards: {
        some: {
          columns: {
            some: {
              id: columnId,
            },
          },
        },
      },
    },
  });

  if (!isMine) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const lastCard = await prisma.card.findFirst({
    where: { columnId },
    orderBy: { position: "desc" },
  });

  const position = lastCard ? lastCard.position + 1 : 0;

  const card = await prisma.card.create({
    data: {
      columnId,
      title,
      description,
      position,
    },
  });

  broadcast({ type: "CARD_UPDATED" });

  res.status(201).json(card);
});

app.delete(
  "/api/cards/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = (req as any).user;

    const isMine = await prisma.user.findFirst({
      where: {
        id: userId,
        boards: {
          some: {
            columns: {
              some: {
                cards: {
                  some: {
                    id: id as string,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!isMine) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await prisma.card.delete({
      where: { id: id as string },
    });

    broadcast({ type: "CARD_UPDATED" });
    res.json({ message: "Card deleted successfully" });
  },
);

app.put("/api/cards/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = (req as any).user;
  const { title, description, columnId, position } = req.body;

  const isMine = await prisma.user.findFirst({
    where: {
      id: userId,
      boards: {
        some: {
          columns: {
            some: {
              cards: {
                some: { id: id as string },
              },
            },
          },
        },
      },
    },
  });

  if (!isMine) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const updatedCard = await prisma.card.update({
    where: { id: id as string },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(columnId !== undefined && { columnId }),
      ...(position !== undefined && { position }),
    },
  });

  broadcast({ type: "CARD_UPDATED" });
  res.json(updatedCard);
});

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "OK", message: "Backend Express Typescript are ready!" });
});

const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

const broadcast = (data: any) => {
  const message = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

wss.on("connection", (socket: WebSocket) => {
  console.log("Client connected via Websocket");

  socket.on("close", () => {
    console.log("Client disconnected");
  });
});
