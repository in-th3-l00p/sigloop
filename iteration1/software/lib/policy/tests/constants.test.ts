import { describe, it, expect } from "vitest"
import {
  AGENT_PERMISSION_VALIDATOR_ABI,
  X402_PAYMENT_POLICY_ABI,
  SPENDING_LIMIT_HOOK_ABI,
  DEFI_EXECUTOR_ABI,
  NATIVE_TOKEN_ADDRESS,
  VALIDATOR_MODULE_TYPE,
  EXECUTOR_MODULE_TYPE,
  HOOK_MODULE_TYPE,
  AGENT_POLICY_ABI_PARAMS,
  X402_BUDGET_ABI_PARAMS,
} from "../src/constants.js"

describe("ABIs", () => {
  it("AGENT_PERMISSION_VALIDATOR_ABI is defined", () => {
    expect(AGENT_PERMISSION_VALIDATOR_ABI).toBeDefined()
    expect(AGENT_PERMISSION_VALIDATOR_ABI.length).toBeGreaterThan(0)
  })

  it("X402_PAYMENT_POLICY_ABI is defined", () => {
    expect(X402_PAYMENT_POLICY_ABI).toBeDefined()
    expect(X402_PAYMENT_POLICY_ABI.length).toBeGreaterThan(0)
  })

  it("SPENDING_LIMIT_HOOK_ABI is defined", () => {
    expect(SPENDING_LIMIT_HOOK_ABI).toBeDefined()
    expect(SPENDING_LIMIT_HOOK_ABI.length).toBeGreaterThan(0)
  })

  it("DEFI_EXECUTOR_ABI is defined", () => {
    expect(DEFI_EXECUTOR_ABI).toBeDefined()
    expect(DEFI_EXECUTOR_ABI.length).toBeGreaterThan(0)
  })
})

describe("constants", () => {
  it("NATIVE_TOKEN_ADDRESS is correct", () => {
    expect(NATIVE_TOKEN_ADDRESS).toBe("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
  })

  it("module type IDs are correct", () => {
    expect(VALIDATOR_MODULE_TYPE).toBe(1n)
    expect(EXECUTOR_MODULE_TYPE).toBe(2n)
    expect(HOOK_MODULE_TYPE).toBe(4n)
  })

  it("ABI params are defined", () => {
    expect(AGENT_POLICY_ABI_PARAMS).toBeDefined()
    expect(AGENT_POLICY_ABI_PARAMS.length).toBe(1)
    expect(X402_BUDGET_ABI_PARAMS).toBeDefined()
    expect(X402_BUDGET_ABI_PARAMS.length).toBe(1)
  })
})
