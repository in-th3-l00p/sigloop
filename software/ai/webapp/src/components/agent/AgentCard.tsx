import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentStatusBadge } from "./AgentStatusBadge";
import { AddressDisplay } from "@/components/shared/AddressDisplay";
import { Clock, Shield } from "lucide-react";
import type { Agent } from "@/types";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const expiryDate = new Date(agent.expiresAt).toLocaleDateString();

  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{agent.name}</CardTitle>
          <AgentStatusBadge status={agent.status} />
        </div>
        <AddressDisplay address={agent.sessionKeyAddress} />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>Policy: {agent.policyId.slice(0, 8)}...</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Expires: {expiryDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}
