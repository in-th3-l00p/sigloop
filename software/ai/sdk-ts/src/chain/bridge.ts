import {
  type Address,
  type Hex,
  createPublicClient,
  http,
  encodeFunctionData,
  parseAbi,
} from "viem";
import { SupportedChain } from "../types/chain.js";
import { getChainConfig } from "./config.js";
import { validateAddress, validateAmount } from "../utils/validation.js";
import { encodeBridgeData } from "../utils/encoding.js";

export interface BridgeParams {
  sourceChain: SupportedChain;
  destinationChain: SupportedChain;
  token: Address;
  amount: bigint;
  recipient: Address;
  maxSlippageBps?: number;
}

export interface BridgeResult {
  calldata: Hex;
  to: Address;
  value: bigint;
  estimatedTime: number;
  bridgeData: Hex;
}

const BRIDGE_ROUTER_ABI = parseAbi([
  "function bridge(uint32 destChainId, address token, uint256 amount, address recipient, uint256 minAmountOut) external payable",
  "function getBridgeFee(uint32 destChainId, address token, uint256 amount) external view returns (uint256)",
]);

const BRIDGE_ROUTER_ADDRESSES: Record<SupportedChain, Address> = {
  [SupportedChain.Base]: "0x4200000000000000000000000000000000000010" as Address,
  [SupportedChain.Arbitrum]: "0x0000000000000000000000000000000000000064" as Address,
  [SupportedChain.BaseSepolia]: "0x4200000000000000000000000000000000000010" as Address,
  [SupportedChain.ArbitrumSepolia]: "0x0000000000000000000000000000000000000064" as Address,
};

const NATIVE_TOKEN: Address = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export async function bridgeTokens(params: BridgeParams): Promise<BridgeResult> {
  validateAddress(params.token);
  validateAddress(params.recipient);
  validateAmount(params.amount, "bridge amount");

  if (params.sourceChain === params.destinationChain) {
    throw new Error("Source and destination chains must be different");
  }

  const sourceConfig = getChainConfig(params.sourceChain);
  const slippageBps = params.maxSlippageBps ?? 50;
  const minAmountOut = params.amount - (params.amount * BigInt(slippageBps)) / 10000n;

  const routerAddress = BRIDGE_ROUTER_ADDRESSES[params.sourceChain];

  const isNative = params.token.toLowerCase() === NATIVE_TOKEN.toLowerCase();

  const client = createPublicClient({
    chain: sourceConfig.chain,
    transport: http(sourceConfig.rpcUrl),
  });

  let bridgeFee = 0n;
  try {
    bridgeFee = await client.readContract({
      address: routerAddress,
      abi: BRIDGE_ROUTER_ABI,
      functionName: "getBridgeFee",
      args: [params.destinationChain, params.token, params.amount],
    });
  } catch {
    bridgeFee = params.amount / 1000n;
  }

  const calldata = encodeFunctionData({
    abi: BRIDGE_ROUTER_ABI,
    functionName: "bridge",
    args: [
      params.destinationChain,
      params.token,
      params.amount,
      params.recipient,
      minAmountOut,
    ],
  });

  const value = isNative ? params.amount + bridgeFee : bridgeFee;

  const bridgeData = encodeBridgeData(
    params.sourceChain,
    params.destinationChain,
    params.token,
    params.amount,
    params.recipient
  );

  const estimatedTime = estimateBridgeTime(params.sourceChain, params.destinationChain);

  return {
    calldata,
    to: routerAddress,
    value,
    estimatedTime,
    bridgeData,
  };
}

function estimateBridgeTime(source: SupportedChain, destination: SupportedChain): number {
  const isTestnet =
    source === SupportedChain.BaseSepolia ||
    source === SupportedChain.ArbitrumSepolia ||
    destination === SupportedChain.BaseSepolia ||
    destination === SupportedChain.ArbitrumSepolia;

  if (isTestnet) {
    return 300;
  }

  if (
    (source === SupportedChain.Base && destination === SupportedChain.Arbitrum) ||
    (source === SupportedChain.Arbitrum && destination === SupportedChain.Base)
  ) {
    return 120;
  }

  return 600;
}

export async function estimateBridgeFee(params: Omit<BridgeParams, "recipient" | "maxSlippageBps">): Promise<bigint> {
  const sourceConfig = getChainConfig(params.sourceChain);
  const routerAddress = BRIDGE_ROUTER_ADDRESSES[params.sourceChain];

  const client = createPublicClient({
    chain: sourceConfig.chain,
    transport: http(sourceConfig.rpcUrl),
  });

  try {
    return await client.readContract({
      address: routerAddress,
      abi: BRIDGE_ROUTER_ABI,
      functionName: "getBridgeFee",
      args: [params.destinationChain, params.token, params.amount],
    });
  } catch {
    return params.amount / 1000n;
  }
}
