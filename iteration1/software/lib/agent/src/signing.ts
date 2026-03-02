import { privateKeyToAccount } from "viem/accounts"
import type { Address, Hex } from "viem"

export async function signUserOpAsAgent(
  agentAddress: Address,
  privateKey: Hex,
  userOpHash: Hex,
): Promise<Hex> {
  const account = privateKeyToAccount(privateKey)
  const signature = await account.signMessage({
    message: { raw: userOpHash },
  })

  const addressHex = agentAddress.slice(2).toLowerCase()
  const sigHex = signature.slice(2)

  return `0x${addressHex}${sigHex}` as Hex
}
