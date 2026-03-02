import type { Hono } from "hono"
import { createNodeWebSocket } from "@hono/node-ws"
import { createWsHandler, type WsHandlerDeps } from "./handler.js"

export function setupWebSocket(app: Hono, deps: WsHandlerDeps) {
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: app as any })
  const handler = createWsHandler(deps)

  app.get(
    "/ws",
    upgradeWebSocket(() => ({
      onOpen: handler.onOpen,
      onMessage: handler.onMessage,
      onClose: handler.onClose,
      onError: handler.onError,
    })),
  )

  return { injectWebSocket }
}
