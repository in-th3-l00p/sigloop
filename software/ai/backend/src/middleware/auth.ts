import type { MiddlewareHandler } from "hono";
import { config } from "../config/index.js";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const apiKey = c.req.header("X-API-KEY");

  if (!apiKey) {
    return c.json({ error: "Unauthorized", message: "Missing X-API-KEY header", status: 401 }, 401);
  }

  if (apiKey !== config.apiKey) {
    return c.json({ error: "Forbidden", message: "Invalid API key", status: 403 }, 403);
  }

  await next();
};
