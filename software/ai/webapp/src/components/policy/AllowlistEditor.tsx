import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import type { Allowlist } from "@/types";

interface AllowlistEditorProps {
  value: Allowlist;
  onChange: (value: Allowlist) => void;
}

export function AllowlistEditor({ value, onChange }: AllowlistEditorProps) {
  const addContract = () => {
    onChange({ ...value, contracts: [...value.contracts, ""] });
  };

  const removeContract = (index: number) => {
    onChange({
      ...value,
      contracts: value.contracts.filter((_, i) => i !== index),
    });
  };

  const updateContract = (index: number, val: string) => {
    const updated = [...value.contracts];
    updated[index] = val;
    onChange({ ...value, contracts: updated });
  };

  const addFunction = () => {
    onChange({ ...value, functions: [...value.functions, ""] });
  };

  const removeFunction = (index: number) => {
    onChange({
      ...value,
      functions: value.functions.filter((_, i) => i !== index),
    });
  };

  const updateFunction = (index: number, val: string) => {
    const updated = [...value.functions];
    updated[index] = val;
    onChange({ ...value, functions: updated });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Allowed Contracts</h4>
          <Button variant="ghost" size="sm" onClick={addContract}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        {value.contracts.map((addr, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="0x..."
              value={addr}
              onChange={(e) => updateContract(i, e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeContract(i)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Allowed Functions</h4>
          <Button variant="ghost" size="sm" onClick={addFunction}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        {value.functions.map((fn, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="transfer(address,uint256)"
              value={fn}
              onChange={(e) => updateFunction(i, e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeFunction(i)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
