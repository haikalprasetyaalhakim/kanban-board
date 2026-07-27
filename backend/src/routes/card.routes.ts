import { Router, type Request, type Response } from "express";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middlewares/auth";
import { pubClient } from "../config/redis";
import { cardLimiter } from "../middlewares/rate-limiter";

const router = Router();

router.post(
  "/",
  requireAuth,
  cardLimiter,
  async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { columnId, title, description } = req.body;

    if (!columnId || !title)
      return res.status(400).json({ message: "columnId and title required" });

    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        board: { userId },
      },
      select: { boardId: true },
    });

    if (!column) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const boardId = column.boardId;

    const lastCard = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { position: "desc" },
    });
    const position = lastCard ? lastCard.position + 1 : 0;

    const card = await prisma.card.create({
      data: { columnId, title, description, position },
    });

    pubClient.publish(
      "kanban-events",
      JSON.stringify({ type: "CARD_UPDATED", boardId }),
    );
    res.status(201).json(card);
  },
);

router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = (req as any).user;
  const { title, description, columnId, position } = req.body;

  const existingCard = await prisma.card.findFirst({
    where: {
      id: id as string,
      column: { board: { userId } },
    },
    select: {
      id: true,
      column: { select: { boardId: true } },
    },
  });

  if (!existingCard) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const boardId = existingCard.column.boardId;

  const updatedCard = await prisma.card.update({
    where: { id: id as string },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(columnId !== undefined && { columnId }),
      ...(position !== undefined && { position }),
    },
  });

  pubClient.publish(
    "kanban-events",
    JSON.stringify({ type: "CARD_UPDATED", boardId }),
  );
  res.json(updatedCard);
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = (req as any).user;

  const existingCard = await prisma.card.findFirst({
    where: {
      id: id as string,
      column: { board: { userId } },
    },
    select: {
      id: true,
      column: { select: { boardId: true } },
    },
  });

  if (!existingCard) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const boardId = existingCard.column.boardId;

  await prisma.card.delete({ where: { id: id as string } });

  pubClient.publish(
    "kanban-events",
    JSON.stringify({ type: "CARD_UPDATED", boardId }),
  );
  res.json({ message: "Card deleted successfully" });
});

export default router;
