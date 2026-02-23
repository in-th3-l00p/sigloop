import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HeaderProps {
  title: string;
}

const chains = [
  { id: "1", name: "Ethereum" },
  { id: "8453", name: "Base" },
  { id: "10", name: "Optimism" },
  { id: "42161", name: "Arbitrum" },
];

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <Select defaultValue="8453">
          <SelectTrigger className="w-36">
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
        <Badge variant="outline" className="gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Connected
        </Badge>
      </div>
    </header>
  );
}
