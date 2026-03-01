import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { AddressDisplay } from "@/components/shared/address-display"
import { StatusDot } from "@/components/shared/status-dot"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { RelativeTime } from "@/components/shared/relative-time"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useAgent, useAgentSession, useAgentPolicy, useRevokeAgent, useSignUserOp } from "@/hooks/use-agents"
import { usePayments } from "@/hooks/use-payments"
import { useWallet } from "@/hooks/use-wallets"
import { remainingTime, formatUsd } from "@/lib/utils"

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: agent } = useAgent(id!)
  const { data: session } = useAgentSession(id!)
  const { data: policy } = useAgentPolicy(id!)
  const { data: payments } = usePayments({ agentId: id })
  const { data: wallet } = useWallet(agent?.walletId ?? "")
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

      {agent.status === "active" && (
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
      )}

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
