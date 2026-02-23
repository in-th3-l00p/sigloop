import { Header } from "@/components/layout/Header";
import { PaymentStats } from "@/components/payment/PaymentStats";
import { PaymentTable } from "@/components/payment/PaymentTable";
import { usePayments, usePaymentStats } from "@/hooks/useX402";

export function Payments() {
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const { data: stats, isLoading: statsLoading } = usePaymentStats();

  return (
    <div>
      <Header title="Payments" />
      <div className="p-6 space-y-6">
        {statsLoading ? (
          <div className="flex justify-center py-6">
            <p className="text-sm text-muted-foreground">Loading stats...</p>
          </div>
        ) : stats ? (
          <PaymentStats stats={stats} />
        ) : null}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Payment History</h2>
          {paymentsLoading ? (
            <div className="flex justify-center py-8">
              <p className="text-sm text-muted-foreground">
                Loading payments...
              </p>
            </div>
          ) : (
            <PaymentTable payments={payments ?? []} />
          )}
        </div>
      </div>
    </div>
  );
}
