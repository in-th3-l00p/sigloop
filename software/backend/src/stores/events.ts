import type { WsEvent } from "../types.js"

export type EventsStore = {
  addClient: (ws: any) => void
  removeClient: (ws: any) => void
  broadcast: (event: WsEvent) => void
  getClients: () => Set<any>
  getRecentEvents: (limit?: number) => WsEvent[]
  clear: () => void
}

export function createEventsStore(): EventsStore {
  const clients = new Set<any>()
  const recentEvents: WsEvent[] = []
  const maxEvents = 100

  return {
    addClient(ws) {
      clients.add(ws)
    },
    removeClient(ws) {
      clients.delete(ws)
    },
    broadcast(event) {
      recentEvents.push(event)
      if (recentEvents.length > maxEvents) {
        recentEvents.shift()
      }

      const message = JSON.stringify(event)
      for (const ws of clients) {
        try {
          ws.send(message)
        } catch {
          clients.delete(ws)
        }
      }
    },
    getClients() {
      return new Set(clients)
    },
    getRecentEvents(limit = 50) {
      return recentEvents.slice(-limit)
    },
    clear() {
      clients.clear()
      recentEvents.length = 0
    },
  }
}
