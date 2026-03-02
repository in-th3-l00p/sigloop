import { useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { StatusDot } from "@/components/shared/status-dot"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/providers/settings"
import { api } from "@/lib/api"

export function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle")
  const [showKey, setShowKey] = useState(false)

  const testConnection = async () => {
    setTestStatus("testing")
    try {
      await api.health()
      setTestStatus("ok")
    } catch {
      setTestStatus("error")
    }
  }

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">API Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Backend URL</Label>
              <Input
                value={settings.backendUrl}
                onChange={(e) => updateSettings({ backendUrl: e.target.value })}
                placeholder="http://localhost:3001"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input
                  type={showKey ? "text" : "password"}
                  value={settings.apiKey}
                  onChange={(e) => updateSettings({ apiKey: e.target.value })}
                  placeholder="Enter API key..."
                />
                <Button variant="outline" onClick={() => setShowKey(!showKey)}>
                  {showKey ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Chain ID</Label>
              <Select
                value={String(settings.chainId)}
                onChange={(e) => updateSettings({ chainId: Number(e.target.value) })}
              >
                <option value="31337">Anvil Local (31337)</option>
                <option value="8453">Base (8453)</option>
                <option value="1">Ethereum (1)</option>
                <option value="42161">Arbitrum (42161)</option>
                <option value="10">Optimism (10)</option>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Connection:</span>
                {testStatus === "idle" && <span className="text-sm text-muted-foreground">Not tested</span>}
                {testStatus === "testing" && <span className="text-sm text-muted-foreground">Testing...</span>}
                {testStatus === "ok" && <StatusDot status="connected" />}
                {testStatus === "error" && <StatusDot status="disconnected" />}
              </div>
              <Button variant="outline" onClick={testConnection} disabled={testStatus === "testing"}>
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
