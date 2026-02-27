export { createKmsWallet, loadKmsWallet } from "./wallet.js"
export type { KmsWallet } from "./wallet.js"

export { createKmsSigner } from "./kms/signer.js"
export { createKmsKey, getKmsPublicKey } from "./kms/client.js"
export { deriveEthAddressFromSpki, extractUncompressedPublicKey } from "./kms/public-key.js"
export { parseDerSignature, normalizeS, toEthSignature } from "./kms/signature.js"

export * from "./constants.js"

export type {
  KmsConfig,
  KmsWalletConfig,
  CreateKmsWalletConfig,
  CreateKmsKeyConfig,
  KmsSignerResult,
  DerSignature,
  EntryPointVersion,
  KernelVersion,
} from "./types.js"
