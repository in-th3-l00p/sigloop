import { Wallet as WalletIcon } from "lucide-react";
import { WalletCard } from "./WalletCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Wallet } from "@/types";

interface WalletListProps {
  wallets: Wallet[];
  onCreateNew: () => void;
}

export function WalletList({ wallets, onCreateNew }: WalletListProps) {
  if (wallets.length === 0) {
    return (
      <EmptyState
        icon={WalletIcon}
        title="No wallets yet"
        description="Create your first smart wallet to start delegating to AI agents."
        actionLabel="Create Wallet"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {wallets.map((wallet) => (
        <WalletCard key={wallet.id} wallet={wallet} />
      ))}
    </div>
  );
}
