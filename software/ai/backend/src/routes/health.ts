import { Hono } from "hono";
import { config } from "../config/index.js";

const health = new Hono();

health.get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: config.version,
  });
});

export { health };
