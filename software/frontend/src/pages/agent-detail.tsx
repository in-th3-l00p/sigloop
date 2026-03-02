import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { AddressDisplay } from "@/components/shared/address-display"
import { StatusDot } from "@/components/shared/status-dot"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { RelativeTime } from "@/components/shared/relative-time"
import { CopyButton } from "@/components/shared/copy-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAgent, useAgentSession, useAgentPolicy, useRevokeAgent, useSignUserOp } from "@/hooks/use-agents"
import { usePayments } from "@/hooks/use-payments"
import { useWallet } from "@/hooks/use-wallets"
import { useSettings } from "@/providers/settings"
import { remainingTime, formatUsd } from "@/lib/utils"

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: agent } = useAgent(id!)
  const { data: session } = useAgentSession(id!)
  const { data: policy } = useAgentPolicy(id!)
  const { data: payments } = usePayments({ agentId: id })
  const { data: wallet } = useWallet(agent?.walletId ?? "")
  const { settings } = useSettings()
  const revokeAgent = useRevokeAgent()
  const signUserOp = useSignUserOp()

  const [revokeOpen, setRevokeOpen] = useState(false)
  const [userOpHash, setUserOpHash] = useState("")
  const [signature, setSignature] = useState("")

  if (!agent) return null

  const sessionPct = session
    ? ((session.expiresAt - Math.floor(Date.now() / 1000)) / (session.expiresAt - (agent.expiresAt - 86400))) * 100
    : 0

  return (
    <div>
      <div className="mb-4">
        <Link to="/agents" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Agents
        </Link>
      </div>

      <PageHeader
        title={agent.name}
        actions={
          agent.status === "active" ? (
            <Button variant="destructive" onClick={() => setRevokeOpen(true)}>Revoke Agent</Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Agent Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <StatusDot status={agent.status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Wallet:</span>
              <Link to={`/wallets/${agent.walletId}`} className="text-sm hover:underline">
                {wallet?.name ?? agent.walletId}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Address:</span>
              <AddressDisplay address={agent.address} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Created:</span>
              <RelativeTime date={agent.createdAt} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {session ? (
              <>
                <p className="text-sm">
                  Expires: {new Date(session.expiresAt * 1000).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Remaining: {remainingTime(session.expiresAt)}
                </p>
                <Progress value={Math.max(0, Math.min(100, sessionPct))} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Session expired or inactive</p>
            )}
          </CardContent>
        </Card>
      </div>

      {policy && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Bound Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto">
              {JSON.stringify(policy, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {payments && payments.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2">Time</th>
                    <th className="text-left py-2">Domain</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="text-left py-2">Currency</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map((p) => (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="py-2"><RelativeTime date={p.createdAt} /></td>
                      <td className="py-2">{p.domain}</td>
                      <td className="py-2 text-right font-mono">{formatUsd(Number(p.amount))}</td>
                      <td className="py-2 text-muted-foreground">{p.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={agent.status === "active" ? "actions" : "integration"} className="mt-2">
        <TabsList>
          {agent.status === "active" && <TabsTrigger value="actions">Actions</TabsTrigger>}
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        {agent.status === "active" && (
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Sign UserOp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="UserOp hash (0x...)"
                  value={userOpHash}
                  onChange={(e) => setUserOpHash(e.target.value)}
                />
                <Button
                  onClick={() =>
                    signUserOp.mutate(
                      { agentId: id!, userOpHash },
                      { onSuccess: (d) => setSignature(d.signature) },
                    )
                  }
                  disabled={!userOpHash || signUserOp.isPending}
                >
                  Sign
                </Button>
                {signature && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">Signature:</p>
                    <p className="text-xs font-mono break-all">{signature}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="integration">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Agent Reference</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Agent ID", value: agent.id },
                  { label: "Agent Address", value: agent.address },
                  { label: "Wallet ID", value: agent.walletId },
                  { label: "API URL", value: settings.backendUrl || "http://localhost:3001" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 truncate">{value}</span>
                    <CopyButton text={value} className="h-7 w-7 shrink-0" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Sign a UserOperation</CardTitle>
                  <CopyButton text={`const API_URL = "${settings.backendUrl || "http://localhost:3001"}"
const AGENT_ID = "${agent.id}"

const res = await fetch(\`\${API_URL}/api/agents/\${AGENT_ID}/sign-user-op\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userOpHash: "0x..." }),
})
const { signature } = await res.json()`} />
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto leading-relaxed">{`const API_URL = "${settings.backendUrl || "http://localhost:3001"}"
const AGENT_ID = "${agent.id}"

const res = await fetch(\`\${API_URL}/api/agents/\${AGENT_ID}/sign-user-op\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userOpHash: "0x..." }),
})
const { signature } = await res.json()`}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Record an x402 Payment</CardTitle>
                  <CopyButton text={`const API_URL = "${settings.backendUrl || "http://localhost:3001"}"

const res = await fetch(\`\${API_URL}/api/payments\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    agentId: "${agent.id}",
    walletId: "${agent.walletId}",
    domain: "api.example.com",
    amount: "1000000",
    currency: "USDC",
  }),
})
const { payment } = await res.json()`} />
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto leading-relaxed">{`const API_URL = "${settings.backendUrl || "http://localhost:3001"}"

const res = await fetch(\`\${API_URL}/api/payments\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    agentId: "${agent.id}",
    walletId: "${agent.walletId}",
    domain: "api.example.com",
    amount: "1000000",
    currency: "USDC",
  }),
})
const { payment } = await res.json()`}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Send a Transaction</CardTitle>
                  <CopyButton text={`const API_URL = "${settings.backendUrl || "http://localhost:3001"}"
const WALLET_ID = "${agent.walletId}"

const res = await fetch(\`\${API_URL}/api/wallets/\${WALLET_ID}/send-transaction\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "0xRecipientAddress",
    value: "1000000000000000000", // 1 ETH in wei
    data: "0x",
  }),
})
const { txHash } = await res.json()`} />
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto leading-relaxed">{`const API_URL = "${settings.backendUrl || "http://localhost:3001"}"
const WALLET_ID = "${agent.walletId}"

const res = await fetch(\`\${API_URL}/api/wallets/\${WALLET_ID}/send-transaction\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "0xRecipientAddress",
    value: "1000000000000000000", // 1 ETH in wei
    data: "0x",
  }),
})
const { txHash } = await res.json()`}</pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        title="Revoke Agent"
        description={`Are you sure you want to revoke "${agent.name}"? This action cannot be undone.`}
        confirmLabel="Revoke"
        destructive
        onConfirm={() => revokeAgent.mutate(agent.id)}
      />
    </div>
  )
}
