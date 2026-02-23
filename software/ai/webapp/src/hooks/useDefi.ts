import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

interface SwapRequest {
  walletId: string;
  fromToken: string;
  toToken: string;
  amount: string;
}

interface LendRequest {
  walletId: string;
  token: string;
  amount: string;
  protocol: string;
}

interface StakeRequest {
  walletId: string;
  token: string;
  amount: string;
  validator: string;
}

export function useSwap() {
  return useMutation({
    mutationFn: (data: SwapRequest) =>
      apiClient<{ txHash: string }>("/defi/swap", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useLend() {
  return useMutation({
    mutationFn: (data: LendRequest) =>
      apiClient<{ txHash: string }>("/defi/lend", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useStake() {
  return useMutation({
    mutationFn: (data: StakeRequest) =>
      apiClient<{ txHash: string }>("/defi/stake", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
