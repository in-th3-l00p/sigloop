import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Shield, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { usePolicies, useCreatePolicy, useDeletePolicy } from "@/hooks/use-policies"
import type { PolicyRecord, AgentPolicyConfig, X402PolicyConfig } from "@/types"

function PolicySummary({ policy }: { policy: PolicyRecord }) {
  const config = policy.config
  if (policy.type === "agent") {
    const c = config as AgentPolicyConfig
    return (
      <div className="text-sm text-muted-foreground space-y-1">
        <p>Daily: {c.dailyLimit}</p>
        <p>Weekly: {c.weeklyLimit}</p>
        <p>Max/tx: {c.maxAmountPerTx}</p>
      </div>
    )
  }
  if (policy.type === "x402") {
    const c = config as X402PolicyConfig
    return (
      <div className="text-sm text-muted-foreground space-y-1">
        <p>Per request: {c.maxPerRequest}</p>
        <p>Daily: {c.dailyBudget}</p>
        <p>Domains: {c.allowedDomains?.length ?? 0}</p>
      </div>
    )
  }
  return <p className="text-sm text-muted-foreground">Spending limit policy</p>
}

function CreatePolicyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreatePolicy()
  const [name, setName] = useState("")
  const [type, setType] = useState("agent")
  const [dailyLimit, setDailyLimit] = useState("10000000")
  const [weeklyLimit, setWeeklyLimit] = useState("50000000")
  const [maxPerTx, setMaxPerTx] = useState("1000000")

  const handleCreate = () => {
    const config =
      type === "agent"
        ? { allowedTargets: [], allowedSelectors: [], maxAmountPerTx: maxPerTx, dailyLimit, weeklyLimit, validAfter: 0, validUntil: Math.floor(Date.now() / 1000) + 86400 * 30 }
        : type === "x402"
          ? { maxPerRequest: maxPerTx, dailyBudget: dailyLimit, totalBudget: weeklyLimit, allowedDomains: [] }
          : { agent: "", token: "", dailyLimit, weeklyLimit }

    create.mutate(
      { name, type, config },
      {
        onSuccess: () => {
          onOpenChange(false)
          setName("")
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Policy</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Policy" />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="agent">Agent Permission</option>
              <option value="x402">x402 Budget</option>
              <option value="spending">Spending Limit</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Daily Limit</Label>
            <Input value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Weekly / Total Limit</Label>
            <Input value={weeklyLimit} onChange={(e) => setWeeklyLimit(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{type === "x402" ? "Max Per Request" : "Max Per Transaction"}</Label>
            <Input value={maxPerTx} onChange={(e) => setMaxPerTx(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name || create.isPending}>
            {create.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PolicyCard({ policy }: { policy: PolicyRecord }) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deletePolicy = useDeletePolicy()

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{policy.name}</h3>
              <Badge variant="secondary" className="mt-1">{policy.type}</Badge>
              <div className="mt-3">
                <PolicySummary policy={policy} />
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/policies/${policy.id}`}>
                <Button variant="outline" size="sm">View</Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Policy"
        description={`Are you sure you want to delete "${policy.name}"?`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => deletePolicy.mutate(policy.id)}
      />
    </>
  )
}

export function PoliciesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data: policies, isLoading } = usePolicies()

  return (
    <div>
      <PageHeader
        title="Policies"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Policy
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !policies || policies.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-12 w-12" />}
          title="No policies"
          description="Create spending and permission policies for your agents."
          action="Create Policy"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {policies.map((p) => (
            <PolicyCard key={p.id} policy={p} />
          ))}
        </div>
      )}

      <CreatePolicyDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
