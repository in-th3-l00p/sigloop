import { describe, it, expect } from "vitest"
import {
  USDC_ADDRESSES,
  EIP_3009_TYPES,
  X402_PAYMENT_HEADER,
  X402_PAYMENT_REQUIRED_HEADER,
  HTTP_STATUS_PAYMENT_REQUIRED,
  DEFAULT_MAX_PER_REQUEST,
  DEFAULT_DAILY_BUDGET,
  DEFAULT_TOTAL_BUDGET,
  ONE_DAY_SECONDS,
} from "../src/constants.js"

describe("USDC addresses", () => {
  it("has mainnet entry", () => {
    expect(USDC_ADDRESSES[1]).toBeDefined()
    expect(USDC_ADDRESSES[1]).toMatch(/^0x/)
  })

  it("has Base entry", () => {
    expect(USDC_ADDRESSES[8453]).toBeDefined()
  })

  it("has Base Sepolia entry", () => {
    expect(USDC_ADDRESSES[84532]).toBeDefined()
  })

  it("has Sepolia entry", () => {
    expect(USDC_ADDRESSES[11155111]).toBeDefined()
  })
})

describe("EIP-3009 types", () => {
  it("has TransferWithAuthorization type", () => {
    expect(EIP_3009_TYPES.TransferWithAuthorization).toBeDefined()
    expect(EIP_3009_TYPES.TransferWithAuthorization.length).toBe(6)
  })
})

describe("constants", () => {
  it("X402_PAYMENT_HEADER is X-PAYMENT", () => {
    expect(X402_PAYMENT_HEADER).toBe("X-PAYMENT")
  })

  it("X402_PAYMENT_REQUIRED_HEADER is X-PAYMENT-REQUIRED", () => {
    expect(X402_PAYMENT_REQUIRED_HEADER).toBe("X-PAYMENT-REQUIRED")
  })

  it("HTTP_STATUS_PAYMENT_REQUIRED is 402", () => {
    expect(HTTP_STATUS_PAYMENT_REQUIRED).toBe(402)
  })

  it("default budgets are reasonable", () => {
    expect(DEFAULT_MAX_PER_REQUEST).toBe(1000000n)
    expect(DEFAULT_DAILY_BUDGET).toBe(10000000n)
    expect(DEFAULT_TOTAL_BUDGET).toBe(100000000n)
  })

  it("ONE_DAY_SECONDS is 86400", () => {
    expect(ONE_DAY_SECONDS).toBe(86400)
  })
})
