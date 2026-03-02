import { useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { CopyButton } from "@/components/shared/copy-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useEncodeSwap, useEncodeSupply, useEncodeBorrow, useEncodeRepay, useEncodeApprove } from "@/hooks/use-defi"

type EncodedResult = { to: string; data: string; value?: string }

function ResultDisplay({ result }: { result: EncodedResult | null }) {
  if (!result) return null
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Encoded Result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">To:</p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono">{result.to}</code>
            <CopyButton text={result.to} />
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Data:</p>
          <div className="flex items-start gap-2">
            <code className="text-xs font-mono break-all flex-1 bg-muted p-2 rounded">{result.data}</code>
            <CopyButton text={result.data} />
          </div>
        </div>
        {result.value && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Value:</p>
            <code className="text-sm font-mono">{result.value}</code>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SwapForm() {
  const encode = useEncodeSwap()
  const [chainId, setChainId] = useState(8453)
  const [tokenIn, setTokenIn] = useState("")
  const [tokenOut, setTokenOut] = useState("")
  const [amountIn, setAmountIn] = useState("")
  const [minAmountOut, setMinAmountOut] = useState("")
  const [recipient, setRecipient] = useState("")
  const [result, setResult] = useState<EncodedResult | null>(null)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Chain</Label>
        <Select value={String(chainId)} onChange={(e) => setChainId(Number(e.target.value))}>
          <option value="8453">Base (8453)</option>
          <option value="1">Ethereum (1)</option>
          <option value="42161">Arbitrum (42161)</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Token In</Label>
          <Input value={tokenIn} onChange={(e) => setTokenIn(e.target.value)} placeholder="0x..." />
        </div>
        <div className="space-y-2">
          <Label>Token Out</Label>
          <Input value={tokenOut} onChange={(e) => setTokenOut(e.target.value)} placeholder="0x..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount In</Label>
          <Input value={amountIn} onChange={(e) => setAmountIn(e.target.value)} placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label>Min Amount Out</Label>
          <Input value={minAmountOut} onChange={(e) => setMinAmountOut(e.target.value)} placeholder="0" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Recipient</Label>
        <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x..." />
      </div>
      <Button
        onClick={() =>
          encode.mutate(
            { chainId, tokenIn, tokenOut, amountIn, minAmountOut, recipient },
            { onSuccess: (d) => setResult(d.result) },
          )
        }
        disabled={encode.isPending}
      >
        Encode
      </Button>
      <ResultDisplay result={result} />
    </div>
  )
}

function LendingForm({ action }: { action: "supply" | "borrow" | "repay" }) {
  const encodeSupply = useEncodeSupply()
  const encodeBorrow = useEncodeBorrow()
  const encodeRepay = useEncodeRepay()
  const encode = action === "supply" ? encodeSupply : action === "borrow" ? encodeBorrow : encodeRepay

  const [chainId, setChainId] = useState(8453)
  const [asset, setAsset] = useState("")
  const [amount, setAmount] = useState("")
  const [onBehalfOf, setOnBehalfOf] = useState("")
  const [result, setResult] = useState<EncodedResult | null>(null)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Chain</Label>
        <Select value={String(chainId)} onChange={(e) => setChainId(Number(e.target.value))}>
          <option value="8453">Base (8453)</option>
          <option value="1">Ethereum (1)</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Asset</Label>
        <Input value={asset} onChange={(e) => setAsset(e.target.value)} placeholder="0x..." />
      </div>
      <div className="space-y-2">
        <Label>Amount</Label>
        <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      </div>
      <div className="space-y-2">
        <Label>On Behalf Of</Label>
        <Input value={onBehalfOf} onChange={(e) => setOnBehalfOf(e.target.value)} placeholder="0x..." />
      </div>
      <Button
        onClick={() =>
          encode.mutate(
            { chainId, asset, amount, onBehalfOf },
            { onSuccess: (d) => setResult(d.result) },
          )
        }
        disabled={encode.isPending}
      >
        Encode
      </Button>
      <ResultDisplay result={result} />
    </div>
  )
}

function ApproveForm() {
  const encode = useEncodeApprove()
  const [token, setToken] = useState("")
  const [spender, setSpender] = useState("")
  const [amount, setAmount] = useState("")
  const [result, setResult] = useState<EncodedResult | null>(null)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Token</Label>
        <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="0x..." />
      </div>
      <div className="space-y-2">
        <Label>Spender</Label>
        <Input value={spender} onChange={(e) => setSpender(e.target.value)} placeholder="0x..." />
      </div>
      <div className="space-y-2">
        <Label>Amount</Label>
        <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      </div>
      <Button
        onClick={() =>
          encode.mutate(
            { token, spender, amount },
            { onSuccess: (d) => setResult({ to: d.result.to, data: d.result.data }) },
          )
        }
        disabled={encode.isPending}
      >
        Encode
      </Button>
      <ResultDisplay result={result} />
    </div>
  )
}

export function DefiPage() {
  return (
    <div>
      <PageHeader title="DeFi Operations" description="Encode and preview DeFi operations before execution." />

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="swap">
            <TabsList>
              <TabsTrigger value="swap">Swap</TabsTrigger>
              <TabsTrigger value="supply">Supply</TabsTrigger>
              <TabsTrigger value="borrow">Borrow</TabsTrigger>
              <TabsTrigger value="repay">Repay</TabsTrigger>
              <TabsTrigger value="approve">Approve</TabsTrigger>
            </TabsList>

            <TabsContent value="swap"><SwapForm /></TabsContent>
            <TabsContent value="supply"><LendingForm action="supply" /></TabsContent>
            <TabsContent value="borrow"><LendingForm action="borrow" /></TabsContent>
            <TabsContent value="repay"><LendingForm action="repay" /></TabsContent>
            <TabsContent value="approve"><ApproveForm /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
