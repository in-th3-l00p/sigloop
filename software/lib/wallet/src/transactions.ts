import type { Hex, Abi } from "viem"
import { encodeFunctionData } from "viem"
import type { TransactionRequest } from "./types.js"

export async function sendTransaction(
  client: any,
  tx: TransactionRequest,
): Promise<Hex> {
  return client.sendTransaction({
    to: tx.to,
    value: tx.value ?? 0n,
    data: tx.data ?? "0x",
  })
}

export async function sendTransactions(
  client: any,
  txs: TransactionRequest[],
): Promise<Hex> {
  return client.sendTransaction({
    calls: txs.map((tx) => ({
      to: tx.to,
      value: tx.value ?? 0n,
      data: tx.data ?? "0x",
    })),
  })
}

export async function sendUserOperation(
  client: any,
  callData: Hex,
) {
  const hash = await client.sendUserOperation({ callData })

  return {
    hash: hash as Hex,
    wait: () => client.waitForUserOperationReceipt({ hash }),
  }
}

export async function sendContractCall(
  client: any,
  params: {
    address: `0x${string}`
    abi: Abi
    functionName: string
    args?: unknown[]
    value?: bigint
  },
): Promise<Hex> {
  const data = encodeFunctionData({
    abi: params.abi,
    functionName: params.functionName,
    args: params.args,
  })

  return sendTransaction(client, {
    to: params.address,
    value: params.value,
    data,
  })
}

export { encodeFunctionData } from "viem"
