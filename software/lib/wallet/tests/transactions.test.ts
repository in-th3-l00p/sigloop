import { describe, it, expect, vi } from "vitest"
import { parseAbi } from "viem"
import { sendTransaction, sendTransactions, sendUserOperation, sendContractCall } from "../src/transactions.js"

function createMockClient() {
  return {
    sendTransaction: vi.fn().mockResolvedValue("0xtxhash"),
    sendUserOperation: vi.fn().mockResolvedValue("0xuserophash"),
    waitForUserOperationReceipt: vi.fn().mockResolvedValue({
      receipt: { transactionHash: "0xtxhash" },
      userOpHash: "0xuserophash",
    }),
  }
}

describe("sendTransaction", () => {
  it("sends a transaction with to, value, and data", async () => {
    const client = createMockClient()
    const result = await sendTransaction(client, {
      to: "0x1234567890123456789012345678901234567890",
      value: 1000n,
      data: "0xdeadbeef",
    })

    expect(client.sendTransaction).toHaveBeenCalledWith({
      to: "0x1234567890123456789012345678901234567890",
      value: 1000n,
      data: "0xdeadbeef",
    })
    expect(result).toBe("0xtxhash")
  })

  it("defaults value to 0n when not provided", async () => {
    const client = createMockClient()
    await sendTransaction(client, {
      to: "0x1234567890123456789012345678901234567890",
    })

    expect(client.sendTransaction).toHaveBeenCalledWith({
      to: "0x1234567890123456789012345678901234567890",
      value: 0n,
      data: "0x",
    })
  })

  it("defaults data to 0x when not provided", async () => {
    const client = createMockClient()
    await sendTransaction(client, {
      to: "0x1234567890123456789012345678901234567890",
      value: 500n,
    })

    expect(client.sendTransaction).toHaveBeenCalledWith({
      to: "0x1234567890123456789012345678901234567890",
      value: 500n,
      data: "0x",
    })
  })
})

describe("sendTransactions", () => {
  it("sends batched transactions as calls array", async () => {
    const client = createMockClient()
    const txs = [
      { to: "0x1111111111111111111111111111111111111111" as const, value: 100n },
      { to: "0x2222222222222222222222222222222222222222" as const, data: "0xabcd" as const },
      { to: "0x3333333333333333333333333333333333333333" as const },
    ]

    const result = await sendTransactions(client, txs)

    expect(client.sendTransaction).toHaveBeenCalledWith({
      calls: [
        { to: "0x1111111111111111111111111111111111111111", value: 100n, data: "0x" },
        { to: "0x2222222222222222222222222222222222222222", value: 0n, data: "0xabcd" },
        { to: "0x3333333333333333333333333333333333333333", value: 0n, data: "0x" },
      ],
    })
    expect(result).toBe("0xtxhash")
  })

  it("handles empty array", async () => {
    const client = createMockClient()
    await sendTransactions(client, [])

    expect(client.sendTransaction).toHaveBeenCalledWith({ calls: [] })
  })

  it("handles single transaction in batch", async () => {
    const client = createMockClient()
    await sendTransactions(client, [
      { to: "0x1111111111111111111111111111111111111111" as const },
    ])

    expect(client.sendTransaction).toHaveBeenCalledWith({
      calls: [
        { to: "0x1111111111111111111111111111111111111111", value: 0n, data: "0x" },
      ],
    })
  })
})

describe("sendUserOperation", () => {
  it("sends a user operation and returns hash with wait function", async () => {
    const client = createMockClient()
    const result = await sendUserOperation(client, "0xcalldata")

    expect(client.sendUserOperation).toHaveBeenCalledWith({ callData: "0xcalldata" })
    expect(result.hash).toBe("0xuserophash")
    expect(typeof result.wait).toBe("function")
  })

  it("wait function calls waitForUserOperationReceipt", async () => {
    const client = createMockClient()
    const result = await sendUserOperation(client, "0xcalldata")

    const receipt = await result.wait()

    expect(client.waitForUserOperationReceipt).toHaveBeenCalledWith({
      hash: "0xuserophash",
    })
    expect(receipt.receipt.transactionHash).toBe("0xtxhash")
  })
})

describe("sendContractCall", () => {
  const abi = parseAbi([
    "function transfer(address to, uint256 amount) returns (bool)",
  ])

  it("encodes function data and sends transaction", async () => {
    const client = createMockClient()
    const result = await sendContractCall(client, {
      address: "0x1234567890123456789012345678901234567890",
      abi,
      functionName: "transfer",
      args: ["0x5555555555555555555555555555555555555555", 1000n],
    })

    expect(client.sendTransaction).toHaveBeenCalledWith({
      to: "0x1234567890123456789012345678901234567890",
      value: 0n,
      data: expect.stringMatching(/^0x/),
    })
    expect(result).toBe("0xtxhash")
  })

  it("passes value for payable functions", async () => {
    const client = createMockClient()
    await sendContractCall(client, {
      address: "0x1234567890123456789012345678901234567890",
      abi,
      functionName: "transfer",
      args: ["0x5555555555555555555555555555555555555555", 1000n],
      value: 500n,
    })

    expect(client.sendTransaction).toHaveBeenCalledWith(expect.objectContaining({
      value: 500n,
    }))
  })

  it("encodes correct function selector", async () => {
    const client = createMockClient()
    await sendContractCall(client, {
      address: "0x1234567890123456789012345678901234567890",
      abi,
      functionName: "transfer",
      args: ["0x5555555555555555555555555555555555555555", 1000n],
    })

    const calledData = client.sendTransaction.mock.calls[0][0].data as string
    expect(calledData.startsWith("0xa9059cbb")).toBe(true)
  })
})
