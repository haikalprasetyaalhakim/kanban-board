import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middlewares/auth";

const router = Router();
const JWT_SECRET = Bun.env.JWT_SECRET!;

router.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser)
    return res.status(409).json({ message: "Email already registered" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword },
  });

  res.status(201).json({ message: "Register successfully", user });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
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
  res.json({
    message: "Login successfully",
    user: { id: user.id, email: user.email },
  });
});

router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ message: "Logout successfully" });
});

router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({ message: "Yuhuuu", user: (req as any).user });
});

export default router;
