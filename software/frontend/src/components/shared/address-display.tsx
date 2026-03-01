import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { truncateAddress } from "@/lib/utils"

export function AddressDisplay({ address, chars = 4 }: { address: string; chars?: number }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-sm">
      <span>{truncateAddress(address, chars)}</span>
      <button
        type="button"
        onClick={copy}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  )
}
