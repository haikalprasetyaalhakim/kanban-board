import rateLimit from "express-rate-limit";

export const cardLimiter = rateLimit({
  windowMs: 15 * 1000,
  max: 10,
  message: { message: "Too many request!" },
  standardHeaders: true,
  legacyHeaders: true,
});
