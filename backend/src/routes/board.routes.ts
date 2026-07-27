import { Router, type Request, type Response } from "express";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const { userId } = (req as any).user;

  let board = await prisma.board.findFirst({
    where: { userId },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: { cards: { orderBy: { position: "asc" } } },
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
            { position: 0, title: "To Do" },
            { position: 1, title: "In Progress" },
            { position: 2, title: "Done" },
          ],
        },
      },
      include: {
        columns: {
          orderBy: { position: "asc" },
          include: { cards: { orderBy: { position: "asc" } } },
        },
      },
    });
  }

  res.json(board);
});

router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  const board = await prisma.board.findUnique({
    where: { id: id as string },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: {
          cards: {
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  if (!board) {
    return res.status(404).json({ message: "Board not found" });
  }

  res.json(board);
});

export default router;
