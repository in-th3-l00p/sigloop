import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

interface StoredKey {
  publicKey: string;
  encryptedPrivateKey: string;
  createdAt: string;
}

const keyStore = new Map<string, StoredKey>();

function simpleEncrypt(key: string): string {
  return Buffer.from(key).toString("base64");
}

function simpleDecrypt(encrypted: string): string {
  return Buffer.from(encrypted, "base64").toString("utf-8");
}

export class KeyManagerService {
  generateKeyPair(): { publicKey: string; privateKey: string } {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    return { publicKey: account.address, privateKey };
  }

  storeKey(id: string, publicKey: string, privateKey: string): void {
    keyStore.set(id, {
      publicKey,
      encryptedPrivateKey: simpleEncrypt(privateKey),
      createdAt: new Date().toISOString(),
    });
  }

  retrievePublicKey(id: string): string | undefined {
    return keyStore.get(id)?.publicKey;
  }

  retrievePrivateKey(id: string): string | undefined {
    const stored = keyStore.get(id);
    if (!stored) return undefined;
    return simpleDecrypt(stored.encryptedPrivateKey);
  }

  deleteKey(id: string): boolean {
    return keyStore.delete(id);
  }

  hasKey(id: string): boolean {
    return keyStore.has(id);
  }
}

export const keyManagerService = new KeyManagerService();
