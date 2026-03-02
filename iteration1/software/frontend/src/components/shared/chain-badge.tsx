import { Badge } from "@/components/ui/badge"
import { chainName } from "@/lib/utils"

export function ChainBadge({ chainId }: { chainId: number }) {
  return (
    <Badge variant="secondary">
      {chainName(chainId)} ({chainId})
    </Badge>
  )
}
