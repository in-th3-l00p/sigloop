import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock } from "lucide-react";
import type { Policy } from "@/types";

interface PolicyCardProps {
  policy: Policy;
}

export function PolicyCard({ policy }: PolicyCardProps) {
  const contractCount = policy.allowlist.contracts.length;
  const hasTimeWindow = policy.timeWindow.validAfter || policy.timeWindow.validUntil;

  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{policy.name}</CardTitle>
          <Badge variant="secondary">
            <FileText className="mr-1 h-3 w-3" />
            {contractCount} contracts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Per Tx</p>
            <p className="font-medium">{policy.spending.maxPerTx} ETH</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Daily</p>
            <p className="font-medium">{policy.spending.dailyLimit} ETH</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Weekly</p>
            <p className="font-medium">{policy.spending.weeklyLimit} ETH</p>
          </div>
        </div>
        {hasTimeWindow && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {policy.timeWindow.validAfter
                ? new Date(policy.timeWindow.validAfter).toLocaleDateString()
                : "Now"}{" "}
              -{" "}
              {policy.timeWindow.validUntil
                ? new Date(policy.timeWindow.validUntil).toLocaleDateString()
                : "No expiry"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
