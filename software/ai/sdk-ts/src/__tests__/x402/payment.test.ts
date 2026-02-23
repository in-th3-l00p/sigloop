import { describe, it, expect, vi } from "vitest";
import {
  signEIP3009Authorization,
  buildPaymentHeader,
  parsePaymentHeader,
} from "../../x402/payment.js";
import type { EIP3009Authorization, PaymentRequirement } from "../../types/x402.js";
import type { Address, Hex } from "viem";

const MOCK_SIGNATURE = "0xabcdef1234567890" as Hex;
const MOCK_ACCOUNT = {
  address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address,
  signTypedData: vi.fn().mockResolvedValue(MOCK_SIGNATURE),
} as any;

const MOCK_TOKEN: Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const MOCK_FROM: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const MOCK_TO: Address = "0x000000000000000000000000000000000000dEaD";

const MOCK_AUTH: EIP3009Authorization = {
  from: MOCK_FROM,
  to: MOCK_TO,
  value: 1000n,
  validAfter: 100n,
  validBefore: 200n,
  nonce: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" as Hex,
};

const MOCK_REQUIREMENT: PaymentRequirement = {
  scheme: "exact",
  network: "base",
  maxAmountRequired: "1000",
  resource: "https://api.example.com/resource",
  description: "Test payment",
  payTo: MOCK_TO,
  maxTimeoutSeconds: 300,
  asset: MOCK_TOKEN,
};

describe("signEIP3009Authorization", () => {
  it("returns an authorization and signature", async () => {
    const result = await signEIP3009Authorization(MOCK_ACCOUNT, {
      tokenAddress: MOCK_TOKEN,
      from: MOCK_FROM,
      to: MOCK_TO,
      value: 1000n,
      validAfter: 100n,
      validBefore: 200n,
      chainId: 8453,
    });

    expect(result.authorization).toBeDefined();
    expect(result.authorization.from).toBe(MOCK_FROM);
    expect(result.authorization.to).toBe(MOCK_TO);
    expect(result.authorization.value).toBe(1000n);
    expect(result.authorization.validAfter).toBe(100n);
    expect(result.authorization.validBefore).toBe(200n);
    expect(result.authorization.nonce).toMatch(/^0x/);
    expect(result.signature).toBe(MOCK_SIGNATURE);
  });

  it("calls signTypedData with the correct domain", async () => {
    await signEIP3009Authorization(MOCK_ACCOUNT, {
      tokenAddress: MOCK_TOKEN,
      from: MOCK_FROM,
      to: MOCK_TO,
      value: 500n,
      validAfter: 0n,
      validBefore: 1000n,
      chainId: 8453,
    });

    expect(MOCK_ACCOUNT.signTypedData).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: expect.objectContaining({
          name: "USD Coin",
          version: "2",
          chainId: 8453,
          verifyingContract: MOCK_TOKEN,
        }),
        primaryType: "TransferWithAuthorization",
      })
    );
  });
});

describe("buildPaymentHeader", () => {
  it("returns a base64 encoded string", () => {
    const header = buildPaymentHeader(MOCK_AUTH, MOCK_SIGNATURE, MOCK_REQUIREMENT);
    expect(typeof header).toBe("string");
    const decoded = JSON.parse(atob(header));
    expect(decoded.x402Version).toBe(1);
    expect(decoded.scheme).toBe("exact");
    expect(decoded.network).toBe("base");
  });

  it("includes the signature in the payload", () => {
    const header = buildPaymentHeader(MOCK_AUTH, MOCK_SIGNATURE, MOCK_REQUIREMENT);
    const decoded = JSON.parse(atob(header));
    expect(decoded.payload.signature).toBe(MOCK_SIGNATURE);
  });

  it("includes the authorization details", () => {
    const header = buildPaymentHeader(MOCK_AUTH, MOCK_SIGNATURE, MOCK_REQUIREMENT);
    const decoded = JSON.parse(atob(header));
    expect(decoded.payload.authorization.from).toBe(MOCK_FROM);
    expect(decoded.payload.authorization.to).toBe(MOCK_TO);
    expect(decoded.payload.authorization.value).toBe("1000");
  });
});

describe("parsePaymentHeader", () => {
  it("parses a header built by buildPaymentHeader", () => {
    const header = buildPaymentHeader(MOCK_AUTH, MOCK_SIGNATURE, MOCK_REQUIREMENT);
    const parsed = parsePaymentHeader(header);

    expect(parsed.authorization.from).toBe(MOCK_FROM);
    expect(parsed.authorization.to).toBe(MOCK_TO);
    expect(parsed.authorization.value).toBe(1000n);
    expect(parsed.authorization.validAfter).toBe(100n);
    expect(parsed.authorization.validBefore).toBe(200n);
    expect(parsed.signature).toBe(MOCK_SIGNATURE);
    expect(parsed.scheme).toBe("exact");
    expect(parsed.network).toBe("base");
  });

  it("round-trips through build and parse", () => {
    const header = buildPaymentHeader(MOCK_AUTH, MOCK_SIGNATURE, MOCK_REQUIREMENT);
    const parsed = parsePaymentHeader(header);
    expect(parsed.authorization.nonce).toBe(MOCK_AUTH.nonce);
  });
});
