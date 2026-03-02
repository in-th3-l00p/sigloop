import type { Hex, TypedDataDefinition } from "viem"
import { hashMessage } from "viem"
import { verifyEIP6492Signature } from "@zerodev/sdk"

export async function signMessage(
  client: any,
  message: string,
): Promise<Hex> {
  return client.signMessage({ message })
}

export async function signTypedData(
  client: any,
  typedData: TypedDataDefinition,
): Promise<Hex> {
  return client.signTypedData(typedData)
}

export async function verifySignature(
  publicClient: any,
  params: {
    signer: `0x${string}`
    message: string
    signature: Hex
  },
): Promise<boolean> {
  return verifyEIP6492Signature({
    signer: params.signer,
    hash: hashMessage(params.message),
    signature: params.signature,
    client: publicClient,
  })
}

export { verifyEIP6492Signature } from "@zerodev/sdk"
