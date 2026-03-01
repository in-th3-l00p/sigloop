import { createContext, useContext, useState, useCallback, type ReactNode, type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

type DialogContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue>({ open: false, setOpen: () => {} })

function Dialog({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setInternalOpen(v)
      onOpenChange?.(v)
    },
    [isControlled, onOpenChange],
  )
  return <DialogContext.Provider value={{ open: isOpen, setOpen }}>{children}</DialogContext.Provider>
}

function DialogTrigger({ children, asChild: _, ...props }: HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { setOpen } = useContext(DialogContext)
  return (
    <button type="button" onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  )
}

function DialogContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useContext(DialogContext)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={() => setOpen(false)} />
      <div
        className={cn(
          "relative z-50 w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg animate-in fade-in-0 zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          onClick={() => setOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
}

function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
}

function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
