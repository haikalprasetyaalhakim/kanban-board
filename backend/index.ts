import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

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

  const existingUser = users.find((user) => user.email === email);
  if (existingUser) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now().toString(),
    email,
    password: hashedPassword,
  };

  users.push(newUser);

  res.status(201).json({
    message: "Register successfully",
    user: { id: newUser.id, email: newUser.email },
  });
});

app.post("/api/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = users.find((user) => user.email === email);
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

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "OK", message: "Backend Express Typescript are ready!" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
