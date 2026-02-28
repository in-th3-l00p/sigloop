import { Hono } from "hono"
import type { Config } from "../config.js"

export function createHealthRoutes(config: Config) {
  const app = new Hono()

  app.get("/", (c) => {
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: config.version,
    })
  })

  return app
}
