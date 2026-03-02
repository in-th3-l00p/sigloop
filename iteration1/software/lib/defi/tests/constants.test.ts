import { describe, it, expect } from "vitest"
import {
  UNISWAP_V3_ROUTER,
  AAVE_V3_POOL,
  DEFAULT_POOL_FEE,
  ACTION_TYPE_MAP,
  UNISWAP_V3_ROUTER_ABI,
  AAVE_V3_POOL_ABI,
  ERC20_APPROVE_ABI,
  DEFI_EXECUTOR_ABI,
} from "../src/constants.js"

describe("router addresses", () => {
  it("UNISWAP_V3_ROUTER has mainnet entry", () => {
    expect(UNISWAP_V3_ROUTER[1]).toBeDefined()
    expect(UNISWAP_V3_ROUTER[1]).toMatch(/^0x/)
  })

  it("UNISWAP_V3_ROUTER has Base entry", () => {
    expect(UNISWAP_V3_ROUTER[8453]).toBeDefined()
  })

  it("AAVE_V3_POOL has mainnet entry", () => {
    expect(AAVE_V3_POOL[1]).toBeDefined()
    expect(AAVE_V3_POOL[1]).toMatch(/^0x/)
  })
})

describe("constants", () => {
  it("DEFAULT_POOL_FEE is 3000", () => {
    expect(DEFAULT_POOL_FEE).toBe(3000)
  })

  it("ACTION_TYPE_MAP has all actions", () => {
    expect(ACTION_TYPE_MAP.swap).toBe(0)
    expect(ACTION_TYPE_MAP.supply).toBe(1)
    expect(ACTION_TYPE_MAP.borrow).toBe(2)
    expect(ACTION_TYPE_MAP.repay).toBe(3)
    expect(ACTION_TYPE_MAP.stake).toBe(4)
    expect(ACTION_TYPE_MAP.unstake).toBe(5)
  })
})

describe("ABIs", () => {
  it("UNISWAP_V3_ROUTER_ABI is defined", () => {
    expect(UNISWAP_V3_ROUTER_ABI.length).toBeGreaterThan(0)
  })

  it("AAVE_V3_POOL_ABI is defined", () => {
    expect(AAVE_V3_POOL_ABI.length).toBeGreaterThan(0)
  })

  it("ERC20_APPROVE_ABI is defined", () => {
    expect(ERC20_APPROVE_ABI.length).toBeGreaterThan(0)
  })

  it("DEFI_EXECUTOR_ABI is defined", () => {
    expect(DEFI_EXECUTOR_ABI.length).toBeGreaterThan(0)
  })
})
