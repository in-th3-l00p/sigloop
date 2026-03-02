import type { ErrorHandler } from "hono"

export const errorHandler: ErrorHandler = (err, c) => {
  const message = err.message || "Internal server error"
  const lower = message.toLowerCase()

  if (lower.includes("not found")) {
    return c.json({ error: message }, 404)
  }

  if (lower.includes("required") || lower.includes("must be") || lower.includes("invalid")) {
    return c.json({ error: message }, 400)
  }

  if (lower.includes("already")) {
    return c.json({ error: message }, 409)
  }

  return c.json({ error: message }, 500)
}
