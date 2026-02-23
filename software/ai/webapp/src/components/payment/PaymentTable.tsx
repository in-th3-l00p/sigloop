import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Payment } from "@/types";

const statusStyles: Record<Payment["status"], string> = {
  settled: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  pending: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  failed: "bg-red-500/15 text-red-500 border-red-500/20",
};

interface PaymentTableProps {
  payments: Payment[];
}

export function PaymentTable({ payments }: PaymentTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No payments recorded yet
              </TableCell>
            </TableRow>
          )}
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(payment.timestamp).toLocaleString()}
              </TableCell>
              <TableCell className="font-medium">{payment.agentName}</TableCell>
              <TableCell className="text-sm">{payment.domain}</TableCell>
              <TableCell className="text-right font-mono text-sm">
                {payment.amount} ETH
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className={statusStyles[payment.status]}>
                  {payment.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
