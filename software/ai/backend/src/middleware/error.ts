import type { ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err, c) => {
  const message = err.message || "Internal Server Error";

  if (message.includes("not found")) {
    return c.json({ error: "Not Found", message, status: 404 }, 404);
  }

  if (message.includes("required") || message.includes("must be") || message.includes("Invalid")) {
    return c.json({ error: "Bad Request", message, status: 400 }, 400);
  }

  if (message.includes("already")) {
    return c.json({ error: "Conflict", message, status: 409 }, 409);
  }

  return c.json({ error: "Internal Server Error", message, status: 500 }, 500);
};
