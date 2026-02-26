import { describe, it, expect, vi, beforeEach } from "vitest"
import { sepolia } from "viem/chains"
import { generatePrivateKey } from "viem/accounts"

vi.mock("@zerodev/ecdsa-validator", () => ({
  signerToEcdsaValidator: vi.fn(async () => ({
    type: "ecdsaValidator",
  })),
  getKernelAddressFromECDSA: vi.fn(),
}))

vi.mock("@zerodev/sdk", async (importOriginal) => {
  const original = await importOriginal<typeof import("@zerodev/sdk")>()
  return {
    ...original,
    createKernelAccount: vi.fn(async () => ({
      address: "0xABCD1234ABCD1234ABCD1234ABCD1234ABCD1234",
      encodeCalls: vi.fn(),
    })),
    createKernelAccountClient: vi.fn(() => ({
      sendTransaction: vi.fn().mockResolvedValue("0xtxhash"),
      sendUserOperation: vi.fn().mockResolvedValue("0xuserophash"),
      waitForUserOperationReceipt: vi.fn().mockResolvedValue({
        receipt: { transactionHash: "0xtxhash" },
      }),
      signMessage: vi.fn().mockResolvedValue("0xsignature"),
      signTypedData: vi.fn().mockResolvedValue("0xtypedsig"),
    })),
    createZeroDevPaymasterClient: vi.fn(() => ({
      sponsorUserOperation: vi.fn(),
    })),
    verifyEIP6492Signature: vi.fn().mockResolvedValue(true),
  }
})

import { createWallet } from "../src/wallet.js"
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from "@zerodev/sdk"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"

describe("createWallet", () => {
  const baseConfig = {
    privateKey: generatePrivateKey(),
    chain: sepolia,
    rpcUrl: "https://rpc.zerodev.app/test",
  } as const

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a wallet with address and all methods", async () => {
    const wallet = await createWallet({ ...baseConfig })

    expect(wallet.address).toBe("0xABCD1234ABCD1234ABCD1234ABCD1234ABCD1234")
    expect(wallet.account).toBeDefined()
    expect(wallet.client).toBeDefined()
    expect(wallet.publicClient).toBeDefined()
    expect(typeof wallet.sendTransaction).toBe("function")
    expect(typeof wallet.sendTransactions).toBe("function")
    expect(typeof wallet.sendUserOperation).toBe("function")
    expect(typeof wallet.sendContractCall).toBe("function")
    expect(typeof wallet.signMessage).toBe("function")
    expect(typeof wallet.signTypedData).toBe("function")
    expect(typeof wallet.verifySignature).toBe("function")
  })

  it("calls signerToEcdsaValidator with the derived signer", async () => {
    await createWallet({ ...baseConfig })

    expect(signerToEcdsaValidator).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        signer: expect.objectContaining({ type: "local" }),
      }),
    )
  })

  it("calls createKernelAccount with the validator", async () => {
    await createWallet({ ...baseConfig })

    expect(createKernelAccount).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        plugins: { sudo: expect.objectContaining({ type: "ecdsaValidator" }) },
      }),
    )
  })

  it("does not create paymaster when sponsorGas is false", async () => {
    const wallet = await createWallet({ ...baseConfig })

    expect(createZeroDevPaymasterClient).not.toHaveBeenCalled()
    expect(wallet.paymasterClient).toBeNull()
  })

  it("creates paymaster when sponsorGas is true", async () => {
    const wallet = await createWallet({
      ...baseConfig,
      sponsorGas: true,
    })

    expect(createZeroDevPaymasterClient).toHaveBeenCalledWith({
      chain: sepolia,
      transport: expect.anything(),
    })
    expect(wallet.paymasterClient).toBeDefined()
  })

  it("creates erc20 paymaster when gasToken is provided", async () => {
    const gasToken = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const

    const wallet = await createWallet({
      ...baseConfig,
      gasToken,
    })

    expect(createZeroDevPaymasterClient).toHaveBeenCalled()
    expect(wallet.paymasterClient).toBeDefined()
  })

  it("passes index to account creation", async () => {
    await createWallet({
      ...baseConfig,
      index: 3n,
    })

    expect(createKernelAccount).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ index: 3n }),
    )
  })

  it("uses publicRpcUrl when provided", async () => {
    await createWallet({
      ...baseConfig,
      publicRpcUrl: "https://eth-sepolia.g.alchemy.com/v2/test",
    })

    expect(signerToEcdsaValidator).toHaveBeenCalled()
  })

  it("sendTransaction delegates to client", async () => {
    const wallet = await createWallet({ ...baseConfig })

    const result = await wallet.sendTransaction({
      to: "0x1234567890123456789012345678901234567890",
      value: 100n,
    })

    expect(result).toBe("0xtxhash")
  })

  it("sendTransactions delegates to client with batch", async () => {
    const wallet = await createWallet({ ...baseConfig })

    const result = await wallet.sendTransactions([
      { to: "0x1234567890123456789012345678901234567890" },
      { to: "0x5678901234567890123456789012345678901234" },
    ])

    expect(result).toBe("0xtxhash")
  })

  it("signMessage delegates to client", async () => {
    const wallet = await createWallet({ ...baseConfig })

    const result = await wallet.signMessage("hello")

    expect(result).toBe("0xsignature")
  })

  it("signTypedData delegates to client", async () => {
    const wallet = await createWallet({ ...baseConfig })

    const result = await wallet.signTypedData({
      domain: { name: "Test", version: "1", chainId: 1 },
      types: { Test: [{ name: "value", type: "string" }] },
      primaryType: "Test",
      message: { value: "test" },
    })

    expect(result).toBe("0xtypedsig")
  })

  it("verifySignature uses account address as signer", async () => {
    const wallet = await createWallet({ ...baseConfig })

    const result = await wallet.verifySignature("hello", "0xsig")

    expect(result).toBe(true)
  })

  it("passes custom kernel version and entry point", async () => {
    await createWallet({
      ...baseConfig,
      kernelVersion: "0.3.2",
      entryPointVersion: "0.7",
    })

    expect(signerToEcdsaValidator).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kernelVersion: "0.3.2" }),
    )
  })
})
