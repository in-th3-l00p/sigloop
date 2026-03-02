import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { configureApi } from "@/lib/api"

type Settings = {
  backendUrl: string
  apiKey: string
  chainId: number
}

type SettingsContextValue = {
  settings: Settings
  updateSettings: (partial: Partial<Settings>) => void
}

const defaultSettings: Settings = {
  backendUrl: "",
  apiKey: "",
  chainId: 31337,
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  updateSettings: () => {},
})

export function useSettings() {
  return useContext(SettingsContext)
}

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem("sigloop-settings")
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) }
  } catch {
    // ignore
  }
  return defaultSettings
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(loadSettings)

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      localStorage.setItem("sigloop-settings", JSON.stringify(next))
      configureApi(next.backendUrl, next.apiKey)
      return next
    })
  }, [])

  useEffect(() => {
    configureApi(settings.backendUrl, settings.apiKey)
  }, [settings.backendUrl, settings.apiKey])

  return <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>
}
