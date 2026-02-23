import { Badge } from "@/components/ui/badge";
import type { AgentStatus } from "@/types";

const statusConfig: Record<
  AgentStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  },
  revoked: {
    label: "Revoked",
    className: "bg-red-500/15 text-red-500 border-red-500/20",
  },
  expired: {
    label: "Expired",
    className: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  },
};

interface AgentStatusBadgeProps {
  status: AgentStatus;
}

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
