import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SpendingLimitInput } from "./SpendingLimitInput";
import { AllowlistEditor } from "./AllowlistEditor";
import { useCreatePolicy } from "@/hooks/usePolicy";
import type { SpendingLimit, Allowlist } from "@/types";

interface PolicyBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PolicyBuilder({ open, onOpenChange }: PolicyBuilderProps) {
  const [name, setName] = useState("");
  const [spending, setSpending] = useState<SpendingLimit>({
    maxPerTx: "",
    dailyLimit: "",
    weeklyLimit: "",
  });
  const [allowlist, setAllowlist] = useState<Allowlist>({
    contracts: [],
    functions: [],
  });
  const [validAfter, setValidAfter] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const createPolicy = useCreatePolicy();

  const handleSubmit = () => {
    createPolicy.mutate(
      {
        name,
        spending,
        allowlist,
        timeWindow: { validAfter, validUntil },
      },
      {
        onSuccess: () => {
          setName("");
          setSpending({ maxPerTx: "", dailyLimit: "", weeklyLimit: "" });
          setAllowlist({ contracts: [], functions: [] });
          setValidAfter("");
          setValidUntil("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Policy</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Policy Name</label>
            <Input
              placeholder="Default Spending Policy"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Separator />
          <SpendingLimitInput value={spending} onChange={setSpending} />
          <Separator />
          <AllowlistEditor value={allowlist} onChange={setAllowlist} />
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Time Window</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Valid After
                </label>
                <Input
                  type="datetime-local"
                  value={validAfter}
                  onChange={(e) => setValidAfter(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Valid Until
                </label>
                <Input
                  type="datetime-local"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || createPolicy.isPending}
          >
            {createPolicy.isPending ? "Creating..." : "Create Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
