import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { PaymentTable } from "@/components/payment/PaymentTable";
import { AgentStatusBadge } from "@/components/agent/AgentStatusBadge";
import { AddressDisplay } from "@/components/shared/AddressDisplay";
import { Wallet, Bot, Shield, CreditCard } from "lucide-react";
import { useWallets } from "@/hooks/useWallet";
import { useAgents } from "@/hooks/useAgent";
import { usePolicies } from "@/hooks/usePolicy";
import { usePayments, usePaymentStats } from "@/hooks/useX402";

export function Dashboard() {
  const { data: wallets } = useWallets();
  const { data: agents } = useAgents();
  const { data: policies } = usePolicies();
  const { data: payments } = usePayments();
  const { data: stats } = usePaymentStats();

  const statCards = [
    {
      title: "Wallets",
      value: wallets?.length ?? 0,
      icon: Wallet,
    },
    {
      title: "Agents",
      value: agents?.length ?? 0,
      icon: Bot,
    },
    {
      title: "Policies",
      value: policies?.length ?? 0,
      icon: Shield,
    },
    {
      title: "Total x402 Spend",
      value: stats?.totalSpent ? `${stats.totalSpent} ETH` : "0 ETH",
      icon: CreditCard,
    },
  ];

  const recentPayments = (payments ?? []).slice(0, 5);
  const recentAgents = (agents ?? []).slice(0, 5);

  return (
    <div>
      <Header title="Dashboard" />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-lg font-semibold">Recent Payments</h2>
            <PaymentTable payments={recentPayments} />
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Recent Agents</h2>
            <div className="space-y-2">
              {recentAgents.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No agents yet
                </p>
              )}
              {recentAgents.map((agent) => (
                <Card key={agent.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{agent.name}</p>
                      <AddressDisplay address={agent.sessionKeyAddress} />
                    </div>
                    <AgentStatusBadge status={agent.status} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
