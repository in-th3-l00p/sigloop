import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentList } from "@/components/agent/AgentList";
import { CreateAgentDialog } from "@/components/agent/CreateAgentDialog";
import { useAgents } from "@/hooks/useAgent";
import { Plus } from "lucide-react";
import type { AgentStatus } from "@/types";

type FilterTab = "all" | AgentStatus;

export function Agents() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const { data: agents, isLoading } = useAgents();

  const filteredAgents = (agents ?? []).filter((agent) => {
    if (filter === "all") return true;
    return agent.status === filter;
  });

  return (
    <div>
      <Header title="Agents" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as FilterTab)}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="revoked">Revoked</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <p className="text-sm text-muted-foreground">Loading agents...</p>
          </div>
        ) : (
          <AgentList
            agents={filteredAgents}
            onCreateNew={() => setDialogOpen(true)}
          />
        )}
      </div>
      <CreateAgentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
