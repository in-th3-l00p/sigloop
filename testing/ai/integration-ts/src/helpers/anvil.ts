import {
  createPublicClient,
  createWalletClient,
  createTestClient,
  http,
  defineChain,
  type PublicClient,
  type WalletClient,
  type TestClient,
  type Transport,
  type Chain,
  type Account,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ANVIL_RPC_URL, ANVIL_CHAIN_ID } from "../config.js";

export const anvilChain = defineChain({
  id: ANVIL_CHAIN_ID,
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [ANVIL_RPC_URL] },
  },
});

export function getPublicClient(): PublicClient<Transport, Chain> {
  return createPublicClient({
    chain: anvilChain,
    transport: http(ANVIL_RPC_URL),
  });
}

export function getWalletClient(privateKey: `0x${string}`): WalletClient<Transport, Chain, Account> {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: anvilChain,
    transport: http(ANVIL_RPC_URL),
  });
}

export function getTestClient(): TestClient<"anvil", Transport, Chain> {
  return createTestClient({
    mode: "anvil",
    chain: anvilChain,
    transport: http(ANVIL_RPC_URL),
  });
}
