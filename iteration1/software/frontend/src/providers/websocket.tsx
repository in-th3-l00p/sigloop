import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { WsEvent } from "@/types"

type WsStatus = "connecting" | "connected" | "disconnected"

type WebSocketContextValue = {
  status: WsStatus
  events: WsEvent[]
}

const defaultWsContext: WebSocketContextValue = {
  status: "disconnected",
  events: [],
}
const WebSocketContext = createContext<WebSocketContextValue>(defaultWsContext)

export function useWebSocket() {
  return useContext(WebSocketContext)
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WsStatus>("disconnected")
  const [events, setEvents] = useState<WsEvent[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const qc = useQueryClient()

  const addEvent = useCallback((event: WsEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, 50))
  }, [])

  const handleMessage = useCallback(
    (data: WsEvent) => {
      switch (data.type) {
        case "catchup":
          if (data.events) {
            setEvents(data.events.slice(0, 50))
          }
          break
        case "pong":
          break
        case "payment:recorded":
          addEvent(data)
          qc.invalidateQueries({ queryKey: ["payments"] })
          qc.invalidateQueries({ queryKey: ["analytics"] })
          break
        case "agent:created":
        case "agent:revoked":
          addEvent(data)
          qc.invalidateQueries({ queryKey: ["agents"] })
          break
        case "budget:warning":
        case "budget:exceeded":
          addEvent(data)
          qc.invalidateQueries({ queryKey: ["payments", "budget"] })
          break
        default:
          addEvent(data)
      }
    },
    [addEvent, qc],
  )

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}/ws`

    setStatus("connecting")
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setStatus("connected")
      retryRef.current = 0
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as WsEvent
        handleMessage(data)
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      setStatus("disconnected")
      wsRef.current = null
      const delay = Math.min(1000 * 2 ** retryRef.current, 30000)
      retryRef.current++
      timerRef.current = setTimeout(connect, delay)
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [handleMessage])

  useEffect(() => {
    connect()
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }))
      }
    }, 30000)

    return () => {
      clearInterval(pingInterval)
      clearTimeout(timerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return <WebSocketContext.Provider value={{ status, events }}>{children}</WebSocketContext.Provider>
}
