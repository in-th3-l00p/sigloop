import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "./config/index.js";
import { routes } from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";

const app = new Hono();

app.use("/*", cors());
app.onError(errorHandler);
app.route("/api", routes);

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Sigloop backend running on http://localhost:${info.port}`);
});

export { app };
