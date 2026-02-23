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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateWallet } from "@/hooks/useWallet";

interface CreateWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const chains = [
  { id: "1", name: "Ethereum" },
  { id: "8453", name: "Base" },
  { id: "10", name: "Optimism" },
  { id: "42161", name: "Arbitrum" },
];

export function CreateWalletDialog({
  open,
  onOpenChange,
}: CreateWalletDialogProps) {
  const [name, setName] = useState("");
  const [chainId, setChainId] = useState("8453");
  const createWallet = useCreateWallet();

  const handleSubmit = () => {
    createWallet.mutate(
      { name, chainId: Number(chainId) },
      {
        onSuccess: () => {
          setName("");
          setChainId("8453");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="My Agent Wallet"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Chain</label>
            <Select value={chainId} onValueChange={setChainId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chains.map((chain) => (
                  <SelectItem key={chain.id} value={chain.id}>
                    {chain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || createWallet.isPending}
          >
            {createWallet.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
