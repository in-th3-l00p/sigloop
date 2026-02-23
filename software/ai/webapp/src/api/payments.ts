import { apiClient } from "./client";
import type { Payment, PaymentStats } from "@/types";

export function fetchPayments() {
  return apiClient<Payment[]>("/payments");
}

export function fetchPaymentStats() {
  return apiClient<PaymentStats>("/payments/stats");
}
