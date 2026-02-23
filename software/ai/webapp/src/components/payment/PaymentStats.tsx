import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Hash, TrendingUp, Globe } from "lucide-react";
import type { PaymentStats as PaymentStatsType } from "@/types";

interface PaymentStatsProps {
  stats: PaymentStatsType;
}

export function PaymentStats({ stats }: PaymentStatsProps) {
  const topDomain = stats.topDomains[0];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Spent
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalSpent} ETH</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Payments
          </CardTitle>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalPayments}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg Per Payment
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.avgPerPayment} ETH</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top Domain
          </CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold truncate">
            {topDomain?.domain ?? "N/A"}
          </p>
          {topDomain && (
            <p className="text-xs text-muted-foreground">
              {topDomain.amount} ETH
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
