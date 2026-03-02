import { describe, it, expect } from "vitest"
import {
  DEFAULT_SESSION_DURATION,
  VALIDATOR_MODULE_TYPE_ID,
  SIGNATURE_LENGTH,
  ADDRESS_BYTE_LENGTH,
  ECDSA_SIGNATURE_LENGTH,
} from "../src/constants.js"

describe("constants", () => {
  it("DEFAULT_SESSION_DURATION is 1 day", () => {
    expect(DEFAULT_SESSION_DURATION).toBe(86400)
  })

  it("VALIDATOR_MODULE_TYPE_ID is 1", () => {
    expect(VALIDATOR_MODULE_TYPE_ID).toBe(1n)
  })

  it("SIGNATURE_LENGTH is 85", () => {
    expect(SIGNATURE_LENGTH).toBe(85)
  })

  it("ADDRESS_BYTE_LENGTH is 20", () => {
    expect(ADDRESS_BYTE_LENGTH).toBe(20)
  })

  it("ECDSA_SIGNATURE_LENGTH is 65", () => {
    expect(ECDSA_SIGNATURE_LENGTH).toBe(65)
  })

  it("SIGNATURE_LENGTH = ADDRESS_BYTE_LENGTH + ECDSA_SIGNATURE_LENGTH", () => {
    expect(SIGNATURE_LENGTH).toBe(ADDRESS_BYTE_LENGTH + ECDSA_SIGNATURE_LENGTH)
  })
})
