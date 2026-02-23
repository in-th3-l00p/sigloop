import { useQuery } from "@tanstack/react-query";
import { fetchPayments, fetchPaymentStats } from "@/api/payments";

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: fetchPayments,
  });
}

export function usePaymentStats() {
  return useQuery({
    queryKey: ["payments", "stats"],
    queryFn: fetchPaymentStats,
  });
}
