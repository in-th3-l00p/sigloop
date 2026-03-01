import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { AddressDisplay } from "@/components/shared/address-display"
import { ChainBadge } from "@/components/shared/chain-badge"
import { StatusDot } from "@/components/shared/status-dot"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useWallet, useSignMessage, useSendTransaction } from "@/hooks/use-wallets"
import { useAgents, useRevokeAgent } from "@/hooks/use-agents"
import { remainingTime } from "@/lib/utils"

export function WalletDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: wallet } = useWallet(id!)
  const { data: agents } = useAgents(id)
  const revokeAgent = useRevokeAgent()
  const signMessage = useSignMessage()
  const sendTx = useSendTransaction()

  const [message, setMessage] = useState("")
  const [signature, setSignature] = useState("")
  const [txTo, setTxTo] = useState("")
  const [txValue, setTxValue] = useState("")
  const [txData, setTxData] = useState("")
  const [txHash, setTxHash] = useState("")

  if (!wallet) return null

  return (
    <div>
      <div className="mb-4">
        <Link to="/wallets" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Wallets
        </Link>
      </div>

      <PageHeader title={wallet.name} />

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Address</CardTitle>
          </CardHeader>
          <CardContent>
            <AddressDisplay address={wallet.address} chars={8} />
            <div className="mt-2">
              <ChainBadge chainId={wallet.chainId} />
            </div>
            <p className="text-sm text-muted-foreground mt-2">Created: {new Date(wallet.createdAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">Agents ({agents?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <Card>
            <CardContent className="p-6">
              {!agents || agents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No agents for this wallet</p>
              ) : (
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <Link to={`/agents/${agent.id}`} className="font-medium hover:underline">{agent.name}</Link>
                        <StatusDot status={agent.status} />
                        {agent.status === "active" && (
                          <span className="text-sm text-muted-foreground">
                            expires in {remainingTime(agent.expiresAt)}
                          </span>
                        )}
                      </div>
                      {agent.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeAgent.mutate(agent.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Sign Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Message to sign..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button
                  onClick={() =>
                    signMessage.mutate(
                      { walletId: id!, message },
                      { onSuccess: (d) => setSignature(d.signature) },
                    )
                  }
                  disabled={!message || signMessage.isPending}
                >
                  Sign
                </Button>
                {signature && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">Signature:</p>
                    <p className="text-xs font-mono break-all">{signature}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Send Transaction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input value={txTo} onChange={(e) => setTxTo(e.target.value)} placeholder="0x..." />
                </div>
                <div className="space-y-2">
                  <Label>Value (wei)</Label>
                  <Input value={txValue} onChange={(e) => setTxValue(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Data (hex)</Label>
                  <Input value={txData} onChange={(e) => setTxData(e.target.value)} placeholder="0x" />
                </div>
                <Button
                  onClick={() =>
                    sendTx.mutate(
                      { walletId: id!, to: txTo, value: txValue || undefined, data: txData || undefined },
                      { onSuccess: (d) => setTxHash(d.txHash) },
                    )
                  }
                  disabled={!txTo || sendTx.isPending}
                >
                  Send
                </Button>
                {txHash && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">Transaction Hash:</p>
                    <p className="text-xs font-mono break-all">{txHash}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
