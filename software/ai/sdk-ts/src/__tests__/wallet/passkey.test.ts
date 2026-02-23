import { describe, it, expect, vi } from "vitest";
import { createPasskeyAccount, derivePasskeyAddress } from "../../wallet/passkey.js";
import type { Address, Hex } from "viem";

vi.mock("viem/account-abstraction", () => ({
  createWebAuthnCredential: vi.fn().mockResolvedValue({
    id: "test-credential-id",
    publicKey: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    raw: { id: new ArrayBuffer(32) },
  }),
  toWebAuthnAccount: vi.fn((params: any) => ({
    type: "webauthn",
    id: params.credential.id,
    publicKey: params.credential.publicKey,
  })),
}));

describe("createPasskeyAccount", () => {
  it("creates a passkey account from credential", () => {
    const account = createPasskeyAccount({
      id: "test-id",
      publicKey: "0xabcdef" as Hex,
    });
    expect(account).toBeDefined();
    expect(account.type).toBe("webauthn");
  });
});

describe("derivePasskeyAddress", () => {
  it("returns a valid address from a public key", () => {
    const address = derivePasskeyAddress(
      "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" as Hex
    );
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("returns deterministic addresses", () => {
    const key = "0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678" as Hex;
    const a = derivePasskeyAddress(key);
    const b = derivePasskeyAddress(key);
    expect(a).toBe(b);
  });

  it("returns different addresses for different keys", () => {
    const key1 = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" as Hex;
    const key2 = "0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678" as Hex;
    const a = derivePasskeyAddress(key1);
    const b = derivePasskeyAddress(key2);
    expect(a).not.toBe(b);
  });

  it("returns a 20-byte address from the last 20 bytes of the hash", () => {
    const address = derivePasskeyAddress(
      "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" as Hex
    );
    expect(address.length).toBe(42);
  });
});
