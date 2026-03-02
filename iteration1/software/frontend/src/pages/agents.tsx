import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Bot } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusDot } from "@/components/shared/status-dot"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAgents, useCreateAgent } from "@/hooks/use-agents"
import { useWallets } from "@/hooks/use-wallets"
import { usePolicies } from "@/hooks/use-policies"
import { remainingTime } from "@/lib/utils"
import { CopyButton } from "@/components/shared/copy-button"

function CreateAgentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: wallets } = useWallets()
  const { data: policies } = usePolicies()
  const create = useCreateAgent()

  const [walletId, setWalletId] = useState("")
  const [name, setName] = useState("")
  const [policyId, setPolicyId] = useState("")
  const [duration, setDuration] = useState(86400)
  const [sessionKey, setSessionKey] = useState("")

  const handleCreate = () => {
    create.mutate(
      { walletId, name, policyId: policyId || undefined, sessionDuration: duration },
      {
        onSuccess: (data) => {
          setSessionKey(data.sessionKey)
        },
      },
    )
  }

  const handleClose = () => {
    onOpenChange(false)
    setSessionKey("")
    setName("")
    setWalletId("")
    setPolicyId("")
  }

  if (sessionKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agent Provisioned</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <p className="text-sm font-medium text-yellow-500">Save this session key now. It will not be shown again.</p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <code className="text-xs font-mono break-all flex-1">{sessionKey}</code>
              <CopyButton text={sessionKey} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Provision Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Wallet</Label>
            <Select value={walletId} onChange={(e) => setWalletId(e.target.value)}>
              <option value="">Select wallet...</option>
              {wallets?.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Agent Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="my-agent" />
          </div>
          <div className="space-y-2">
            <Label>Policy (optional)</Label>
            <Select value={policyId} onChange={(e) => setPolicyId(e.target.value)}>
              <option value="">No policy</option>
              {policies?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Session Duration</Label>
            <Select value={String(duration)} onChange={(e) => setDuration(Number(e.target.value))}>
              <option value="3600">1 hour</option>
              <option value="21600">6 hours</option>
              <option value="86400">24 hours</option>
              <option value="604800">7 days</option>
              <option value="2592000">30 days</option>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!walletId || !name || create.isPending}>
            {create.isPending ? "Provisioning..." : "Provision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AgentsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("")
  const [walletFilter, setWalletFilter] = useState("")
  const [search, setSearch] = useState("")
  const { data: agents, isLoading } = useAgents()
  const { data: wallets } = useWallets()

  const filtered = agents?.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false
    if (walletFilter && a.walletId !== walletFilter) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <PageHeader
        title="Agents"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Agent
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
              <option value="expired">Expired</option>
            </Select>
            <Select value={walletFilter} onChange={(e) => setWalletFilter(e.target.value)} className="w-48">
              <option value="">All Wallets</option>
              {wallets?.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="h-40 animate-pulse bg-muted rounded" />
          </CardContent>
        </Card>
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState
          icon={<Bot className="h-12 w-12" />}
          title="No agents"
          description="Provision an AI agent with a scoped session key."
          action="New Agent"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Wallet</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Session</th>
                    <th className="text-left p-4">Policy</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="p-4">
                        <Link to={`/agents/${a.id}`} className="font-medium hover:underline">
                          {a.name}
                        </Link>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {wallets?.find((w) => w.id === a.walletId)?.name ?? a.walletId}
                      </td>
                      <td className="p-4">
                        <StatusDot status={a.status} />
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {a.status === "active" ? remainingTime(a.expiresAt) : "--"}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {a.policyId ?? "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateAgentDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
