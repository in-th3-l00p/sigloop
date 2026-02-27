import { createKmsKey } from "./kms/client.js"
import { createKmsSigner } from "./kms/signer.js"
import type { KmsConfig, CreateKmsKeyConfig, KmsKey } from "./types.js"

export type { KmsKey } from "./types.js"

export type CreateKmsKeyAndSignerConfig = CreateKmsKeyConfig & {
  kmsClient: CreateKmsKeyConfig["kmsClient"]
}

export async function createKey(config: CreateKmsKeyAndSignerConfig): Promise<KmsKey> {
  const keyId = await createKmsKey(config)

  const { signer, address, publicKey } = await createKmsSigner({
    kmsClient: config.kmsClient,
    keyId,
  })

  return { keyId, address, publicKey, signer }
}

export async function loadKey(config: KmsConfig): Promise<KmsKey> {
  const { signer, address, publicKey } = await createKmsSigner(config)

  return { keyId: config.keyId, address, publicKey, signer }
}
