import type { EventsStore } from "../stores/events.js"
import type { WsEvent } from "../types.js"

export type EventEmitter = {
  emit: (event: WsEvent) => void
  subscribe: (ws: any) => void
  unsubscribe: (ws: any) => void
  getRecentEvents: (limit?: number) => WsEvent[]
}

export type EventEmitterDeps = {
  eventsStore: EventsStore
}

export function createEventEmitter(deps: EventEmitterDeps): EventEmitter {
  const { eventsStore } = deps

  return {
    emit(event) {
      eventsStore.broadcast(event)
    },
    subscribe(ws) {
      eventsStore.addClient(ws)
    },
    unsubscribe(ws) {
      eventsStore.removeClient(ws)
    },
    getRecentEvents(limit) {
      return eventsStore.getRecentEvents(limit)
    },
  }
}
