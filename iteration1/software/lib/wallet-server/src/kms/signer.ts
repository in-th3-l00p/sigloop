import { SignCommand } from "@aws-sdk/client-kms"
import {
  hashMessage,
  keccak256,
  serializeTransaction,
  hashTypedData,
} from "viem"
import type { Hex } from "viem"
import { toAccount } from "viem/accounts"
import { getKmsPublicKey } from "./client.js"
import { deriveEthAddressFromSpki } from "./public-key.js"
import { toEthSignature } from "./signature.js"
import type { KmsConfig, KmsSignerResult } from "../types.js"

export async function createKmsSigner(config: KmsConfig): Promise<KmsSignerResult> {
  const derPublicKey = await getKmsPublicKey(config)
  const { address, publicKey } = deriveEthAddressFromSpki(derPublicKey)

  async function kmsSign(hash: Hex): Promise<Hex> {
    const hashBytes = hexToUint8Array(hash)

    const response = await config.kmsClient.send(
      new SignCommand({
        KeyId: config.keyId,
        Message: hashBytes,
        MessageType: "DIGEST",
        SigningAlgorithm: "ECDSA_SHA_256",
      }),
    )

    if (!response.Signature) {
      throw new Error(`KMS Sign returned no signature for key ${config.keyId}`)
    }

    return toEthSignature({
      derSignature: new Uint8Array(response.Signature),
      hash,
      address,
    })
  }

  const signer = toAccount({
    address,

    async sign({ hash }) {
      return kmsSign(hash)
    },

    async signMessage({ message }) {
      const hash = hashMessage(
        typeof message === "string" ? message : message,
      )
      return kmsSign(hash)
    },

    async signTransaction(tx, options) {
      const serializer = options?.serializer ?? serializeTransaction
      const serialized = await serializer(tx)
      const hash = keccak256(serialized)
      return kmsSign(hash)
    },

    async signTypedData(typedData) {
      const hash = hashTypedData(typedData)
      return kmsSign(hash)
    },
  })

  return { signer, address, publicKey }
}

function hexToUint8Array(hex: Hex): Uint8Array {
  const stripped = hex.startsWith("0x") ? hex.slice(2) : hex
  const bytes = new Uint8Array(stripped.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(stripped.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}
