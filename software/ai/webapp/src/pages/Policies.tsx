import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { PolicyCard } from "@/components/policy/PolicyCard";
import { PolicyBuilder } from "@/components/policy/PolicyBuilder";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePolicies } from "@/hooks/usePolicy";
import { Plus, Shield } from "lucide-react";

export function Policies() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: policies, isLoading } = usePolicies();

  return (
    <div>
      <Header title="Policies" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Define spending limits, allowlists, and time windows for agent
            permissions
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Policy
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Loading policies...
            </p>
          </div>
        ) : (policies ?? []).length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No policies yet"
            description="Create a policy to define spending limits and access controls for your agents."
            actionLabel="Create Policy"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {policies?.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>
        )}
      </div>
      <PolicyBuilder open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
