import { Bot } from "lucide-react";
import { AgentCard } from "./AgentCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Agent } from "@/types";

interface AgentListProps {
  agents: Agent[];
  onCreateNew: () => void;
}

export function AgentList({ agents, onCreateNew }: AgentListProps) {
  if (agents.length === 0) {
    return (
      <EmptyState
        icon={Bot}
        title="No agents found"
        description="Create an agent and assign it a session key with scoped permissions."
        actionLabel="Create Agent"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
