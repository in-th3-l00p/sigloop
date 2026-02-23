import {
  type Address,
  type Hex,
  toHex,
  keccak256,
} from "viem";
import { createWebAuthnCredential, toWebAuthnAccount } from "viem/account-abstraction";

export interface PasskeyCredential {
  id: string;
  publicKey: Hex;
  rawId: Uint8Array;
}

export interface PasskeyAuthResult {
  credentialId: string;
  signature: Hex;
  authenticatorData: Hex;
  clientDataJSON: string;
}

export async function createPasskeyCredential(
  name: string
): Promise<PasskeyCredential> {
  const credential = await createWebAuthnCredential({
    name,
  });

  return {
    id: credential.id,
    publicKey: credential.publicKey,
    rawId: new Uint8Array(credential.raw.id as unknown as ArrayBuffer),
  };
}

export function createPasskeyAccount(credential: {
  id: string;
  publicKey: Hex;
}) {
  return toWebAuthnAccount({
    credential: {
      id: credential.id,
      publicKey: credential.publicKey,
    },
  });
}

export async function authenticateWithPasskey(
  credentialId: string,
  challenge: Hex
): Promise<PasskeyAuthResult> {
  const challengeBuffer = Uint8Array.from(
    (challenge.slice(2).match(/.{2}/g) ?? []).map((byte) => parseInt(byte, 16))
  );

  const assertionOptions: PublicKeyCredentialRequestOptions = {
    challenge: challengeBuffer.buffer as ArrayBuffer,
    rpId: globalThis.location?.hostname ?? "sigloop.io",
    userVerification: "required",
    timeout: 60000,
    allowCredentials: [
      {
        id: base64UrlToBuffer(credentialId),
        type: "public-key",
      },
    ],
  };

  const assertion = (await navigator.credentials.get({
    publicKey: assertionOptions,
  })) as PublicKeyCredential;

  if (!assertion) {
    throw new Error("Passkey authentication failed");
  }

  const response = assertion.response as AuthenticatorAssertionResponse;

  return {
    credentialId: assertion.id,
    signature: toHex(new Uint8Array(response.signature)),
    authenticatorData: toHex(new Uint8Array(response.authenticatorData)),
    clientDataJSON: new TextDecoder().decode(response.clientDataJSON),
  };
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

export function derivePasskeyAddress(publicKey: Hex): Address {
  const hash = keccak256(publicKey);
  return `0x${hash.slice(26)}` as Address;
}
