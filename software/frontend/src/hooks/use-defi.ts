import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useEncodeSwap() {
  return useMutation({
    mutationFn: (data: {
      chainId: number
      tokenIn: string
      tokenOut: string
      amountIn: string
      minAmountOut: string
      recipient: string
    }) => api.defi.encodeSwap(data),
  })
}

export function useEncodeSupply() {
  return useMutation({
    mutationFn: (data: { chainId: number; asset: string; amount: string; onBehalfOf: string }) =>
      api.defi.encodeSupply(data),
  })
}

export function useEncodeBorrow() {
  return useMutation({
    mutationFn: (data: { chainId: number; asset: string; amount: string; onBehalfOf: string }) =>
      api.defi.encodeBorrow(data),
  })
}

export function useEncodeRepay() {
  return useMutation({
    mutationFn: (data: { chainId: number; asset: string; amount: string; onBehalfOf: string }) =>
      api.defi.encodeRepay(data),
  })
}

export function useEncodeApprove() {
  return useMutation({
    mutationFn: (data: { token: string; spender: string; amount: string }) =>
      api.defi.encodeApprove(data),
  })
}
