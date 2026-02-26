import { describe, it, expect, vi } from "vitest"

vi.mock("@zerodev/sdk", async (importOriginal) => {
  const original = await importOriginal<typeof import("@zerodev/sdk")>()
  return {
    ...original,
    verifyEIP6492Signature: vi.fn().mockResolvedValue(true),
  }
})

import { signMessage, signTypedData, verifySignature } from "../src/signing.js"
import { verifyEIP6492Signature } from "@zerodev/sdk"
import { hashMessage } from "viem"

describe("signMessage", () => {
  it("calls client.signMessage with the message", async () => {
    const client = {
      signMessage: vi.fn().mockResolvedValue("0xsignature"),
    }

    const result = await signMessage(client, "hello world")

    expect(client.signMessage).toHaveBeenCalledWith({ message: "hello world" })
    expect(result).toBe("0xsignature")
  })

  it("handles empty messages", async () => {
    const client = {
      signMessage: vi.fn().mockResolvedValue("0xsig"),
    }

    await signMessage(client, "")

    expect(client.signMessage).toHaveBeenCalledWith({ message: "" })
  })

  it("handles unicode messages", async () => {
    const client = {
      signMessage: vi.fn().mockResolvedValue("0xsig"),
    }

    await signMessage(client, "hello 🌍")

    expect(client.signMessage).toHaveBeenCalledWith({ message: "hello 🌍" })
  })
})

describe("signTypedData", () => {
  const typedData = {
    domain: {
      name: "Test",
      version: "1",
      chainId: 1,
      verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC" as const,
    },
    types: {
      Person: [
        { name: "name", type: "string" },
        { name: "wallet", type: "address" },
      ],
    },
    primaryType: "Person" as const,
    message: {
      name: "Alice",
      wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
    },
  }

  it("calls client.signTypedData with typed data", async () => {
    const client = {
      signTypedData: vi.fn().mockResolvedValue("0xtypedsig"),
    }

    const result = await signTypedData(client, typedData)

    expect(client.signTypedData).toHaveBeenCalledWith(typedData)
    expect(result).toBe("0xtypedsig")
  })
})

describe("verifySignature", () => {
  it("calls verifyEIP6492Signature with hashed message", async () => {
    const publicClient = { type: "publicClient" }

    const result = await verifySignature(publicClient, {
      signer: "0x1234567890123456789012345678901234567890",
      message: "hello world",
      signature: "0xsignature",
    })

    expect(verifyEIP6492Signature).toHaveBeenCalledWith({
      signer: "0x1234567890123456789012345678901234567890",
      hash: hashMessage("hello world"),
      signature: "0xsignature",
      client: publicClient,
    })
    expect(result).toBe(true)
  })

  it("returns false for invalid signatures", async () => {
    vi.mocked(verifyEIP6492Signature).mockResolvedValueOnce(false)
    const publicClient = { type: "publicClient" }

    const result = await verifySignature(publicClient, {
      signer: "0x1234567890123456789012345678901234567890",
      message: "hello",
      signature: "0xinvalid",
    })

    expect(result).toBe(false)
  })
})
