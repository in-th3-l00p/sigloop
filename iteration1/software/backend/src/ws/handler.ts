import type { EventEmitter } from "./events.js"
import type { Config } from "../config.js"
import type { WSContext } from "hono/ws"

export type WsHandlerDeps = {
  eventEmitter: EventEmitter
  config: Config
}

export function createWsHandler(deps: WsHandlerDeps) {
  const { eventEmitter, config } = deps

  return {
    onOpen(_event: Event, ws: WSContext) {
      eventEmitter.subscribe(ws)
      const recent = eventEmitter.getRecentEvents(10)
      if (recent.length > 0) {
        ws.send(JSON.stringify({ type: "catchup", events: recent }))
      }
    },

    onMessage(event: MessageEvent, ws: WSContext) {
      try {
        const data = JSON.parse(String(event.data))
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }))
        }
      } catch {
        // ignore malformed
      }
    },

    onClose(_event: CloseEvent, ws: WSContext) {
      eventEmitter.unsubscribe(ws)
    },

    onError(_event: Event, ws: WSContext) {
      eventEmitter.unsubscribe(ws)
    },
  }
}
