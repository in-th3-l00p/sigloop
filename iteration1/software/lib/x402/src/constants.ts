import type { Address } from "viem"

export const USDC_ADDRESSES: Record<number, Address> = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
}

export const EIP_3009_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const

export const X402_PAYMENT_HEADER = "X-PAYMENT" as const

export const X402_PAYMENT_REQUIRED_HEADER = "X-PAYMENT-REQUIRED" as const

export const HTTP_STATUS_PAYMENT_REQUIRED = 402 as const

export const DEFAULT_MAX_PER_REQUEST = 1000000n

export const DEFAULT_DAILY_BUDGET = 10000000n

export const DEFAULT_TOTAL_BUDGET = 100000000n

export const ONE_DAY_SECONDS = 86400
