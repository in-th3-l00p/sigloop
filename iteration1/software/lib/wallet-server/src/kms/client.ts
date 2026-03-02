import {
  CreateKeyCommand,
  CreateAliasCommand,
  GetPublicKeyCommand,
} from "@aws-sdk/client-kms"
import type { KmsConfig, CreateKmsKeyConfig } from "../types.js"

export async function createKmsKey(config: CreateKmsKeyConfig): Promise<string> {
  const { kmsClient, alias, description, tags, policy, multiRegion } = config

  const kmsTags = tags
    ? Object.entries(tags).map(([TagKey, TagValue]) => ({ TagKey, TagValue }))
    : undefined

  const createResponse = await kmsClient.send(
    new CreateKeyCommand({
      KeySpec: "ECC_SECG_P256K1",
      KeyUsage: "SIGN_VERIFY",
      Description: description,
      Tags: kmsTags,
      Policy: policy,
      MultiRegion: multiRegion,
    }),
  )

  const keyId = createResponse.KeyMetadata!.KeyId!

  if (alias) {
    await kmsClient.send(
      new CreateAliasCommand({
        AliasName: alias.startsWith("alias/") ? alias : `alias/${alias}`,
        TargetKeyId: keyId,
      }),
    )
  }

  return keyId
}

export async function getKmsPublicKey(config: KmsConfig): Promise<Uint8Array> {
  const response = await config.kmsClient.send(
    new GetPublicKeyCommand({ KeyId: config.keyId }),
  )

  if (!response.PublicKey) {
    throw new Error(`No public key returned for key ${config.keyId}`)
  }

  return new Uint8Array(response.PublicKey)
}
