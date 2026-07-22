import { Router, type Request, type Response } from "express";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middlewares/auth";
import { pubClient } from "../config/redis";

const router = Router();

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const { columnId, title, description } = req.body;

  if (!columnId || !title)
    return res.status(400).json({ message: "columnId and title required" });

  const isMine = await prisma.user.findFirst({
    where: {
      id: userId,
      boards: { some: { columns: { some: { id: columnId } } } },
    },
  });
  if (!isMine) return res.status(401).json({ message: "Unauthorized" });

  const lastCard = await prisma.card.findFirst({
    where: { columnId },
    orderBy: { position: "desc" },
  });
  const position = lastCard ? lastCard.position + 1 : 0;

  const card = await prisma.card.create({
    data: { columnId, title, description, position },
  });

  pubClient.publish("kanban-events", JSON.stringify({ type: "CARD_UPDATED" }));
  res.status(201).json(card);
});

router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = (req as any).user;
  const { title, description, columnId, position } = req.body;

  const isMine = await prisma.user.findFirst({
    where: {
      id: userId,
      boards: {
        some: { columns: { some: { cards: { some: { id: id as string } } } } },
      },
    },
  });
  if (!isMine) return res.status(401).json({ message: "Unauthorized" });

  const updatedCard = await prisma.card.update({
    where: { id: id as string },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(columnId !== undefined && { columnId }),
      ...(position !== undefined && { position }),
    },
  });

  pubClient.publish("kanban-events", JSON.stringify({ type: "CARD_UPDATED" }));
  res.json(updatedCard);
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = (req as any).user;

  const isMine = await prisma.user.findFirst({
    where: {
      id: userId,
      boards: {
        some: { columns: { some: { cards: { some: { id: id as string } } } } },
      },
    },
  });
  if (!isMine) return res.status(401).json({ message: "Unauthorized" });

  await prisma.card.delete({ where: { id: id as string } });

  pubClient.publish("kanban-events", JSON.stringify({ type: "CARD_UPDATED" }));
  res.json({ message: "Card deleted successfully" });
});

export default router;
