import { describe, it, expect } from "vitest"
import {
  DEFAULT_ENTRY_POINT_VERSION,
  DEFAULT_KERNEL_VERSION,
  getEntryPoint,
  KERNEL_V3_1,
  KERNEL_V3_0,
  KERNEL_V3_2,
  KERNEL_V3_3,
  KERNEL_V2_2,
  KERNEL_V2_3,
  KERNEL_V2_4,
} from "../src/constants.js"

describe("constants", () => {
  it("DEFAULT_ENTRY_POINT_VERSION is 0.7", () => {
    expect(DEFAULT_ENTRY_POINT_VERSION).toBe("0.7")
  })

  it("DEFAULT_KERNEL_VERSION is 0.3.1", () => {
    expect(DEFAULT_KERNEL_VERSION).toBe("0.3.1")
  })

  it("exports kernel version constants", () => {
    expect(KERNEL_V3_1).toBeDefined()
    expect(KERNEL_V3_0).toBeDefined()
    expect(KERNEL_V3_2).toBeDefined()
    expect(KERNEL_V3_3).toBeDefined()
    expect(KERNEL_V2_2).toBeDefined()
    expect(KERNEL_V2_3).toBeDefined()
    expect(KERNEL_V2_4).toBeDefined()
  })

  it("getEntryPoint returns entry point for 0.7", () => {
    const ep = getEntryPoint("0.7")

    expect(ep).toBeDefined()
    expect(ep.version).toBe("0.7")
    expect(ep.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })

  it("getEntryPoint returns entry point for 0.6", () => {
    const ep = getEntryPoint("0.6")

    expect(ep).toBeDefined()
    expect(ep.version).toBe("0.6")
    expect(ep.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })

  it("entry points for 0.6 and 0.7 have different addresses", () => {
    const ep06 = getEntryPoint("0.6")
    const ep07 = getEntryPoint("0.7")

    expect(ep06.address).not.toBe(ep07.address)
  })
})
