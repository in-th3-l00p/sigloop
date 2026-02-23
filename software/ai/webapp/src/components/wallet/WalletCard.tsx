import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";
import { AddressDisplay } from "@/components/shared/AddressDisplay";
import type { Wallet } from "@/types";

const chainNames: Record<number, string> = {
  1: "Ethereum",
  8453: "Base",
  10: "Optimism",
  42161: "Arbitrum",
};

interface WalletCardProps {
  wallet: Wallet;
}

export function WalletCard({ wallet }: WalletCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{wallet.name}</CardTitle>
          <Badge variant="secondary">
            {chainNames[wallet.chainId] ?? `Chain ${wallet.chainId}`}
          </Badge>
        </div>
        <AddressDisplay address={wallet.address} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Bot className="h-3.5 w-3.5" />
            <span>{wallet.agentCount} agents</span>
          </div>
          <span className="font-medium">{wallet.totalSpent} ETH</span>
        </div>
      </CardContent>
    </Card>
  );
}
