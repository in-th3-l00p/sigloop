import { describe, it, expect } from "vitest";
import {
  createContractAllowlist,
  createFunctionAllowlist,
  mergeContractAllowlists,
  mergeContractAndFunctionAllowlists,
} from "../../policy/allowlist.js";
import type { Address, Hex } from "viem";

const ADDR1: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const ADDR2: Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ADDR3: Address = "0x000000000000000000000000000000000000dEaD";

describe("createContractAllowlist", () => {
  it("creates an allowlist with a single address", () => {
    const result = createContractAllowlist([ADDR1]);
    expect(result.type).toBe("contract-allowlist");
    expect(result.addresses).toHaveLength(1);
  });

  it("creates an allowlist with multiple addresses", () => {
    const result = createContractAllowlist([ADDR1, ADDR2]);
    expect(result.addresses).toHaveLength(2);
  });

  it("deduplicates addresses", () => {
    const result = createContractAllowlist([ADDR1, ADDR1]);
    expect(result.addresses).toHaveLength(1);
  });

  it("normalizes addresses to lowercase", () => {
    const result = createContractAllowlist([ADDR1]);
    expect(result.addresses[0]).toBe(ADDR1.toLowerCase());
  });

  it("throws for empty array", () => {
    expect(() => createContractAllowlist([])).toThrow(
      "Contract allowlist must contain at least one address"
    );
  });
});

describe("createFunctionAllowlist", () => {
  it("creates an allowlist with function signatures", () => {
    const result = createFunctionAllowlist(ADDR1, [
      "function transfer(address to, uint256 amount)",
    ]);
    expect(result.type).toBe("function-allowlist");
    expect(result.contract).toBe(ADDR1);
    expect(result.selectors).toHaveLength(1);
    expect(result.selectors[0]).toMatch(/^0x[a-f0-9]{8}$/);
  });

  it("accepts raw 4-byte selectors", () => {
    const result = createFunctionAllowlist(ADDR1, ["0xdeadbeef"]);
    expect(result.selectors[0]).toBe("0xdeadbeef");
  });

  it("deduplicates selectors", () => {
    const result = createFunctionAllowlist(ADDR1, [
      "0xdeadbeef",
      "0xdeadbeef",
    ]);
    expect(result.selectors).toHaveLength(1);
  });

  it("handles mixed signatures and selectors", () => {
    const result = createFunctionAllowlist(ADDR1, [
      "function transfer(address to, uint256 amount)",
      "0xdeadbeef",
    ]);
    expect(result.selectors).toHaveLength(2);
  });

  it("throws for empty signatures array", () => {
    expect(() => createFunctionAllowlist(ADDR1, [])).toThrow(
      "Function allowlist must contain at least one signature"
    );
  });

  it("throws for an invalid contract address", () => {
    expect(() =>
      createFunctionAllowlist("invalid" as Address, ["0xdeadbeef"])
    ).toThrow("Invalid address");
  });
});

describe("mergeContractAllowlists", () => {
  it("merges two allowlists", () => {
    const a = createContractAllowlist([ADDR1]);
    const b = createContractAllowlist([ADDR2]);
    const merged = mergeContractAllowlists(a, b);
    expect(merged.addresses).toHaveLength(2);
  });

  it("deduplicates across allowlists", () => {
    const a = createContractAllowlist([ADDR1]);
    const b = createContractAllowlist([ADDR1]);
    const merged = mergeContractAllowlists(a, b);
    expect(merged.addresses).toHaveLength(1);
  });

  it("merges three allowlists", () => {
    const a = createContractAllowlist([ADDR1]);
    const b = createContractAllowlist([ADDR2]);
    const c = createContractAllowlist([ADDR3]);
    const merged = mergeContractAllowlists(a, b, c);
    expect(merged.addresses).toHaveLength(3);
  });
});

describe("mergeContractAndFunctionAllowlists", () => {
  it("merges contracts and function allowlists", () => {
    const contracts = createContractAllowlist([ADDR1]);
    const functions = [createFunctionAllowlist(ADDR2, ["0xdeadbeef"])];
    const merged = mergeContractAndFunctionAllowlists(contracts, functions);
    expect(merged.contracts.addresses).toHaveLength(2);
    expect(merged.functions).toHaveLength(1);
  });

  it("includes the function contract in the contracts list", () => {
    const contracts = createContractAllowlist([ADDR1]);
    const functions = [createFunctionAllowlist(ADDR2, ["0xdeadbeef"])];
    const merged = mergeContractAndFunctionAllowlists(contracts, functions);
    const addrLower = ADDR2.toLowerCase();
    expect(
      merged.contracts.addresses.some((a) => a.toLowerCase() === addrLower)
    ).toBe(true);
  });

  it("handles empty function allowlists array", () => {
    const contracts = createContractAllowlist([ADDR1]);
    const merged = mergeContractAndFunctionAllowlists(contracts, []);
    expect(merged.contracts.addresses).toHaveLength(1);
    expect(merged.functions).toHaveLength(0);
  });
});
