import { describe, it, expect } from "vitest"
import { createEventsStore } from "../../src/stores/events.js"
import { createEventEmitter } from "../../src/ws/events.js"
import type { WsEvent } from "../../src/types.js"

describe("WebSocket Events", () => {
  it("emits events to subscribed clients", () => {
    const eventsStore = createEventsStore()
    const emitter = createEventEmitter({ eventsStore })

    const received: string[] = []
    const mockWs = {
      send(data: string) {
        received.push(data)
      },
    }

    emitter.subscribe(mockWs)

    const event: WsEvent = {
      type: "payment:recorded",
      timestamp: new Date().toISOString(),
      data: { paymentId: "p-1", amount: "100" },
    }

    emitter.emit(event)
    expect(received).toHaveLength(1)
    expect(JSON.parse(received[0]).type).toBe("payment:recorded")
  })

  it("stops sending after unsubscribe", () => {
    const eventsStore = createEventsStore()
    const emitter = createEventEmitter({ eventsStore })

    const received: string[] = []
    const mockWs = { send(data: string) { received.push(data) } }

    emitter.subscribe(mockWs)
    emitter.emit({ type: "agent:created", timestamp: new Date().toISOString(), data: {} })
    emitter.unsubscribe(mockWs)
    emitter.emit({ type: "agent:revoked", timestamp: new Date().toISOString(), data: {} })

    expect(received).toHaveLength(1)
  })

  it("returns recent events", () => {
    const eventsStore = createEventsStore()
    const emitter = createEventEmitter({ eventsStore })

    emitter.emit({ type: "payment:recorded", timestamp: new Date().toISOString(), data: { id: "1" } })
    emitter.emit({ type: "agent:created", timestamp: new Date().toISOString(), data: { id: "2" } })
    emitter.emit({ type: "agent:revoked", timestamp: new Date().toISOString(), data: { id: "3" } })

    const recent = emitter.getRecentEvents(2)
    expect(recent).toHaveLength(2)
    expect(recent[0].type).toBe("agent:created")
    expect(recent[1].type).toBe("agent:revoked")
  })

  it("handles send errors gracefully", () => {
    const eventsStore = createEventsStore()
    const emitter = createEventEmitter({ eventsStore })

    const errorWs = { send() { throw new Error("closed") } }
    emitter.subscribe(errorWs)

    expect(() =>
      emitter.emit({ type: "payment:recorded", timestamp: new Date().toISOString(), data: {} }),
    ).not.toThrow()
  })

  it("broadcasts to multiple clients", () => {
    const eventsStore = createEventsStore()
    const emitter = createEventEmitter({ eventsStore })

    const received1: string[] = []
    const received2: string[] = []

    emitter.subscribe({ send(d: string) { received1.push(d) } })
    emitter.subscribe({ send(d: string) { received2.push(d) } })

    emitter.emit({ type: "budget:warning", timestamp: new Date().toISOString(), data: {} })

    expect(received1).toHaveLength(1)
    expect(received2).toHaveLength(1)
  })
})
