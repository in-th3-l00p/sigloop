import { serve } from "@hono/node-server"
import { createApp } from "./app.js"
import { createConfig } from "./config.js"
import { setupWebSocket } from "./ws/index.js"

const config = createConfig()
const { app, eventEmitter } = createApp(config)

const { injectWebSocket } = setupWebSocket(app, { eventEmitter, config })

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Sigloop backend running on http://localhost:${info.port}`)
  console.log(`  REST API: http://localhost:${info.port}/api`)
  console.log(`  GraphQL:  http://localhost:${info.port}/graphql`)
  console.log(`  WebSocket: ws://localhost:${info.port}/ws`)
})

injectWebSocket(server)
