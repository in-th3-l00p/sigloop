export { createWallet, getWalletAddress } from "./create.js";

export {
  addGuardian,
  removeGuardian,
  initiateRecovery,
  executeRecovery,
  getRecoveryRequest,
  cancelRecovery,
  type RecoveryRequest,
} from "./recover.js";

export {
  createPasskeyCredential,
  createPasskeyAccount,
  authenticateWithPasskey,
  derivePasskeyAddress,
  type PasskeyCredential,
  type PasskeyAuthResult,
} from "./passkey.js";
