import {
  type Address,
  createPublicClient,
  http,
  parseAbi,
  getAddress,
} from "viem";
import type { SupportedChain } from "../types/chain.js";
import { getChainConfig } from "../chain/config.js";
import { validateAddress } from "../utils/validation.js";

const SESSION_KEY_REGISTRY_ABI = parseAbi([
  "function getActiveSessionKeys(address wallet) external view returns (address[])",
  "function getSessionKeyData(address sessionKey) external view returns (address owner, uint48 validAfter, uint48 validUntil, bool active)",
  "event SessionKeyEnabled(address indexed wallet, address indexed sessionKey, uint48 validAfter, uint48 validUntil)",
  "event SessionKeyDisabled(address indexed wallet, address indexed sessionKey)",
]);

export interface AgentInfo {
  sessionKeyAddress: Address;
  walletAddress: Address;
  validAfter: number;
  validUntil: number;
  isActive: boolean;
  isExpired: boolean;
}

export async function listAgents(
  walletAddress: Address,
  chainId: SupportedChain
): Promise<AgentInfo[]> {
  validateAddress(walletAddress);

  const chainConfig = getChainConfig(chainId);
  const client = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });

  try {
    const sessionKeys = await client.readContract({
      address: walletAddress,
      abi: SESSION_KEY_REGISTRY_ABI,
      functionName: "getActiveSessionKeys",
      args: [walletAddress],
    });

    const now = Math.floor(Date.now() / 1000);

    const agentInfos: AgentInfo[] = await Promise.all(
      sessionKeys.map(async (keyAddress: Address) => {
        try {
          const [owner, validAfter, validUntil, active] = await client.readContract({
            address: walletAddress,
            abi: SESSION_KEY_REGISTRY_ABI,
            functionName: "getSessionKeyData",
            args: [keyAddress],
          });

          return {
            sessionKeyAddress: keyAddress,
            walletAddress,
            validAfter: Number(validAfter),
            validUntil: Number(validUntil),
            isActive: active && now >= Number(validAfter) && now < Number(validUntil),
            isExpired: now >= Number(validUntil),
          };
        } catch {
          return {
            sessionKeyAddress: keyAddress,
            walletAddress,
            validAfter: 0,
            validUntil: 0,
            isActive: false,
            isExpired: true,
          };
        }
      })
    );

    return agentInfos;
  } catch {
    return listAgentsFromEvents(walletAddress, chainId);
  }
}

async function listAgentsFromEvents(
  walletAddress: Address,
  chainId: SupportedChain
): Promise<AgentInfo[]> {
  const chainConfig = getChainConfig(chainId);
  const client = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });

  const currentBlock = await client.getBlockNumber();
  const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;

  const enabledLogs = await client.getLogs({
    address: walletAddress,
    event: {
      type: "event",
      name: "SessionKeyEnabled",
      inputs: [
        { type: "address", name: "wallet", indexed: true },
        { type: "address", name: "sessionKey", indexed: true },
        { type: "uint48", name: "validAfter", indexed: false },
        { type: "uint48", name: "validUntil", indexed: false },
      ],
    },
    fromBlock,
    toBlock: currentBlock,
  });

  const disabledLogs = await client.getLogs({
    address: walletAddress,
    event: {
      type: "event",
      name: "SessionKeyDisabled",
      inputs: [
        { type: "address", name: "wallet", indexed: true },
        { type: "address", name: "sessionKey", indexed: true },
      ],
    },
    fromBlock,
    toBlock: currentBlock,
  });

  const disabledKeys = new Set(
    disabledLogs.map((log) => getAddress(log.args.sessionKey as string))
  );

  const now = Math.floor(Date.now() / 1000);

  return enabledLogs
    .filter((log) => !disabledKeys.has(getAddress(log.args.sessionKey as string)))
    .map((log) => {
      const validAfter = Number(log.args.validAfter);
      const validUntil = Number(log.args.validUntil);
      return {
        sessionKeyAddress: getAddress(log.args.sessionKey as string),
        walletAddress,
        validAfter,
        validUntil,
        isActive: now >= validAfter && now < validUntil,
        isExpired: now >= validUntil,
      };
    });
}
