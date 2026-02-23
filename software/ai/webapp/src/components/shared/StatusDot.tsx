import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  green: "bg-emerald-500",
  red: "bg-red-500",
  yellow: "bg-amber-500",
  gray: "bg-zinc-500",
};

interface StatusDotProps {
  color: "green" | "red" | "yellow" | "gray";
  className?: string;
}

export function StatusDot({ color, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        colorMap[color],
        className
      )}
    />
  );
}
