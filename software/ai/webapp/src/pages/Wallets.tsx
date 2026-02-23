import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { WalletList } from "@/components/wallet/WalletList";
import { CreateWalletDialog } from "@/components/wallet/CreateWalletDialog";
import { useWallets } from "@/hooks/useWallet";
import { Plus } from "lucide-react";

export function Wallets() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: wallets, isLoading } = useWallets();

  return (
    <div>
      <Header title="Wallets" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Manage smart wallets for your AI agents
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Wallet
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <p className="text-sm text-muted-foreground">Loading wallets...</p>
          </div>
        ) : (
          <WalletList
            wallets={wallets ?? []}
            onCreateNew={() => setDialogOpen(true)}
          />
        )}
      </div>
      <CreateWalletDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
