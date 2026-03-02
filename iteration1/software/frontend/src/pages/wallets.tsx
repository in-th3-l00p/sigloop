import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Wallet, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { AddressDisplay } from "@/components/shared/address-display"
import { ChainBadge } from "@/components/shared/chain-badge"
import { RelativeTime } from "@/components/shared/relative-time"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useWallets, useCreateWallet, useDeleteWallet } from "@/hooks/use-wallets"
import { useAgents } from "@/hooks/use-agents"

function CreateWalletDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("")
  const [chainId, setChainId] = useState(8453)
  const create = useCreateWallet()

  const handleCreate = () => {
    create.mutate({ name, chainId }, {
      onSuccess: () => {
        onOpenChange(false)
        setName("")
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Wallet" />
          </div>
          <div className="space-y-2">
            <Label>Chain</Label>
            <Select value={String(chainId)} onChange={(e) => setChainId(Number(e.target.value))}>
              <option value="8453">Base (8453)</option>
              <option value="1">Ethereum (1)</option>
              <option value="42161">Arbitrum (42161)</option>
              <option value="10">Optimism (10)</option>
              <option value="31337">Anvil Local (31337)</option>
            </Select>
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

function WalletCard({ wallet }: { wallet: { id: string; name: string; address: string; chainId: number; createdAt: string } }) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteWallet = useDeleteWallet()
  const { data: agents } = useAgents(wallet.id)

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{wallet.name}</h3>
              <AddressDisplay address={wallet.address} />
              <div className="flex items-center gap-3 mt-2">
                <ChainBadge chainId={wallet.chainId} />
                <span className="text-sm text-muted-foreground">
                  Agents: {agents?.length ?? 0}
                </span>
                <RelativeTime date={wallet.createdAt} />
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/wallets/${wallet.id}`}>
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
        title="Delete Wallet"
        description={`Are you sure you want to delete "${wallet.name}"? This will also remove all associated agents.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteWallet.mutate(wallet.id)}
      />
    </>
  )
}

export function WalletsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data: wallets, isLoading } = useWallets()

  return (
    <div>
      <PageHeader
        title="Wallets"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Wallet
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !wallets || wallets.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-12 w-12" />}
          title="No wallets"
          description="Create your first ERC-4337 smart wallet to get started."
          action="Create Wallet"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {wallets.map((w) => (
            <WalletCard key={w.id} wallet={w} />
          ))}
        </div>
      )}

      <CreateWalletDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
