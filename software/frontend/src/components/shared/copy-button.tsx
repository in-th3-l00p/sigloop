import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"

export function CopyButton({ text, ...props }: { text: string } & Omit<ButtonProps, "onClick">) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="ghost" size="icon" onClick={copy} {...props}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  )
}
