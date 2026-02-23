import { Input } from "@/components/ui/input";
import type { SpendingLimit } from "@/types";

interface SpendingLimitInputProps {
  value: SpendingLimit;
  onChange: (value: SpendingLimit) => void;
}

export function SpendingLimitInput({ value, onChange }: SpendingLimitInputProps) {
  const handleChange = (field: keyof SpendingLimit, val: string) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Spending Limits</h4>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Max Per Tx (ETH)</label>
          <Input
            placeholder="0.1"
            value={value.maxPerTx}
            onChange={(e) => handleChange("maxPerTx", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Daily Limit (ETH)</label>
          <Input
            placeholder="1.0"
            value={value.dailyLimit}
            onChange={(e) => handleChange("dailyLimit", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Weekly Limit (ETH)</label>
          <Input
            placeholder="5.0"
            value={value.weeklyLimit}
            onChange={(e) => handleChange("weeklyLimit", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
