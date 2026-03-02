import { createContext, useContext, useState, type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type TabsContextValue = { value: string; setValue: (v: string) => void }
const TabsContext = createContext<TabsContextValue>({ value: "", setValue: () => {} })

function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { defaultValue?: string; value?: string; onValueChange?: (v: string) => void }) {
  const [internal, setInternal] = useState(defaultValue ?? "")
  const value = controlledValue ?? internal
  const setValue = (v: string) => {
    if (controlledValue === undefined) setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  value,
  className,
  ...props
}: HTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = useContext(TabsContext)
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        ctx.value === value && "bg-background text-foreground shadow",
        className,
      )}
      onClick={() => ctx.setValue(value)}
      {...props}
    />
  )
}

function TabsContent({
  value,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { value: string }) {
  const ctx = useContext(TabsContext)
  if (ctx.value !== value) return null
  return <div className={cn("mt-2 ring-offset-background focus-visible:outline-none", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
