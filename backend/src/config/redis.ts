import Redis from "ioredis";

const REDIS_URL = Bun.env.REDIS_URL!;

export const pubClient = new Redis(REDIS_URL);
export const subClient = new Redis(REDIS_URL);
