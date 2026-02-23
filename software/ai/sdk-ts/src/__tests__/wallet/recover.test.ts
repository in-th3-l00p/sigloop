import { describe, it, expect, vi } from "vitest";
import {
  addGuardian,
  removeGuardian,
  initiateRecovery,
  executeRecovery,
  cancelRecovery,
} from "../../wallet/recover.js";
import { SupportedChain } from "../../types/chain.js";
import type { SigloopWallet } from "../../types/wallet.js";
import type { Address, Hex } from "viem";

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: vi.fn().mockResolvedValue([
        "0x0000000000000000000000000000000000000000",
        0n,
        0n,
      ]),
    })),
  };
});

function createMockWallet(guardians: Address[] = []): SigloopWallet {
  return {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
    smartAccount: {} as any,
    owner: {} as any,
    chainId: SupportedChain.Base,
    entryPointVersion: "0.7",
    guardians: [...guardians],
  };
}

const GUARDIAN1: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const GUARDIAN2: Address = "0x000000000000000000000000000000000000dEaD";

describe("addGuardian", () => {
  it("adds a guardian and returns calldata", async () => {
    const wallet = createMockWallet();
    const calldata = await addGuardian(wallet, GUARDIAN1);
    expect(calldata).toMatch(/^0x/);
    expect(wallet.guardians).toContain(GUARDIAN1);
  });

  it("throws for duplicate guardian", async () => {
    const wallet = createMockWallet([GUARDIAN1]);
    await expect(addGuardian(wallet, GUARDIAN1)).rejects.toThrow("Guardian already exists");
  });

  it("throws for invalid address", async () => {
    const wallet = createMockWallet();
    await expect(addGuardian(wallet, "invalid" as Address)).rejects.toThrow("Invalid address");
  });

  it("adds multiple guardians sequentially", async () => {
    const wallet = createMockWallet();
    await addGuardian(wallet, GUARDIAN1);
    await addGuardian(wallet, GUARDIAN2);
    expect(wallet.guardians).toHaveLength(2);
  });
});

describe("removeGuardian", () => {
  it("removes a guardian and returns calldata", async () => {
    const wallet = createMockWallet([GUARDIAN1, GUARDIAN2]);
    const calldata = await removeGuardian(wallet, GUARDIAN1);
    expect(calldata).toMatch(/^0x/);
    expect(wallet.guardians).not.toContain(GUARDIAN1);
    expect(wallet.guardians).toHaveLength(1);
  });

  it("throws when guardian is not found", async () => {
    const wallet = createMockWallet([GUARDIAN1]);
    await expect(removeGuardian(wallet, GUARDIAN2)).rejects.toThrow("Guardian not found");
  });

  it("throws when trying to remove the last guardian", async () => {
    const wallet = createMockWallet([GUARDIAN1]);
    await expect(removeGuardian(wallet, GUARDIAN1)).rejects.toThrow(
      "Cannot remove the last guardian"
    );
  });

  it("throws for invalid address", async () => {
    const wallet = createMockWallet([GUARDIAN1]);
    await expect(removeGuardian(wallet, "invalid" as Address)).rejects.toThrow("Invalid address");
  });
});

describe("initiateRecovery", () => {
  it("returns calldata with valid params", async () => {
    const calldata = await initiateRecovery(
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address,
      ["0xabcdef" as Hex],
      SupportedChain.Base
    );
    expect(calldata).toMatch(/^0x/);
  });

  it("throws for invalid wallet address", async () => {
    await expect(
      initiateRecovery(
        "invalid" as Address,
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address,
        ["0xabcdef" as Hex],
        SupportedChain.Base
      )
    ).rejects.toThrow("Invalid address");
  });

  it("throws for invalid new owner address", async () => {
    await expect(
      initiateRecovery(
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
        "invalid" as Address,
        ["0xabcdef" as Hex],
        SupportedChain.Base
      )
    ).rejects.toThrow("Invalid address");
  });

  it("throws when no signatures provided", async () => {
    await expect(
      initiateRecovery(
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address,
        [],
        SupportedChain.Base
      )
    ).rejects.toThrow("At least one guardian signature is required");
  });
});

describe("executeRecovery", () => {
  it("returns calldata with valid params", async () => {
    const calldata = await executeRecovery(
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address,
      SupportedChain.Base
    );
    expect(calldata).toMatch(/^0x/);
  });

  it("throws for invalid wallet address", async () => {
    await expect(
      executeRecovery(
        "invalid" as Address,
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address,
        SupportedChain.Base
      )
    ).rejects.toThrow("Invalid address");
  });

  it("throws for invalid new owner address", async () => {
    await expect(
      executeRecovery(
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
        "invalid" as Address,
        SupportedChain.Base
      )
    ).rejects.toThrow("Invalid address");
  });
});

describe("cancelRecovery", () => {
  it("returns calldata with valid address", async () => {
    const calldata = await cancelRecovery(
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address
    );
    expect(calldata).toMatch(/^0x/);
  });

  it("throws for invalid address", async () => {
    await expect(cancelRecovery("invalid" as Address)).rejects.toThrow("Invalid address");
  });
});
