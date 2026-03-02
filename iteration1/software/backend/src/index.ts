import { serve } from "@hono/node-server"
import { createApp } from "./app.js"
import { createConfig } from "./config.js"
import { setupWebSocket } from "./ws/index.js"

const config = createConfig()
const { app, eventEmitter, db } = createApp(config)

const { injectWebSocket } = setupWebSocket(app, { eventEmitter, config })

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Sigloop backend running on http://localhost:${info.port}`)
  console.log(`  REST API: http://localhost:${info.port}/api`)
  console.log(`  GraphQL:  http://localhost:${info.port}/graphql`)
  console.log(`  WebSocket: ws://localhost:${info.port}/ws`)
  console.log(`  Database: ${config.dbType}${config.dbUrl ? ` (${config.dbUrl})` : ""}`)
})

injectWebSocket(server)

process.on("SIGTERM", () => {
  db?.close()
  process.exit(0)
})

process.on("SIGINT", () => {
  db?.close()
  process.exit(0)
})
