import express, { type Request, type Response } from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors({ origin: "http://localhost:5173" }));

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "OK", message: "Backend Express Typescript are ready!" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
