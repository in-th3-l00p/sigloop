export { createKey, loadKey } from "./key.js"
export type { KmsKey } from "./key.js"

export { createKmsSigner } from "./kms/signer.js"
export { createKmsKey, getKmsPublicKey } from "./kms/client.js"
export { deriveEthAddressFromSpki, extractUncompressedPublicKey } from "./kms/public-key.js"
export { parseDerSignature, normalizeS, toEthSignature } from "./kms/signature.js"

export * from "./constants.js"

export type {
  KmsConfig,
  CreateKmsKeyConfig,
  KmsSignerResult,
  DerSignature,
} from "./types.js"
