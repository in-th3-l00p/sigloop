import {
  type Address,
  type Hex,
  encodeFunctionData,
  parseAbi,
  createPublicClient,
  http,
} from "viem";
import type { SwapParams, SwapResult } from "../types/defi.js";
import { SupportedChain } from "../types/chain.js";
import { getChainConfig } from "../chain/config.js";
import { validateAddress, validateAmount } from "../utils/validation.js";

const UNISWAP_V3_ROUTER_ABI = parseAbi([
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
  "function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)",
]);

const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
]);

const SWAP_ROUTER_ADDRESSES: Record<SupportedChain, Address> = {
  [SupportedChain.Base]: "0x2626664c2603336E57B271c5C0b26F421741e481",
  [SupportedChain.Arbitrum]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  [SupportedChain.BaseSepolia]: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
  [SupportedChain.ArbitrumSepolia]: "0x101F443B4d1b059569D643917553c771E1b9663E",
};

const NATIVE_TOKEN: Address = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DEFAULT_FEE = 3000;

export async function executeSwap(params: SwapParams): Promise<SwapResult> {
  validateAddress(params.tokenIn);
  validateAddress(params.tokenOut);
  validateAddress(params.recipient);
  validateAmount(params.amountIn, "amountIn");
  validateAmount(params.minAmountOut, "minAmountOut");

  const routerAddress = SWAP_ROUTER_ADDRESSES[params.chainId];
  if (!routerAddress) {
    throw new Error(`No swap router for chain ${params.chainId}`);
  }

  const isNativeIn = params.tokenIn.toLowerCase() === NATIVE_TOKEN.toLowerCase();

  const calldata = encodeFunctionData({
    abi: UNISWAP_V3_ROUTER_ABI,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        fee: DEFAULT_FEE,
        recipient: params.recipient,
        amountIn: params.amountIn,
        amountOutMinimum: params.minAmountOut,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });

  return {
    amountOut: params.minAmountOut,
    calldata,
    to: routerAddress,
    value: isNativeIn ? params.amountIn : 0n,
  };
}

export function buildApproveCalldata(
  tokenAddress: Address,
  spender: Address,
  amount: bigint
): { calldata: Hex; to: Address } {
  validateAddress(tokenAddress);
  validateAddress(spender);

  const calldata = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [spender, amount],
  });

  return { calldata, to: tokenAddress };
}

export async function checkAllowance(
  tokenAddress: Address,
  owner: Address,
  spender: Address,
  chainId: SupportedChain
): Promise<bigint> {
  const chainConfig = getChainConfig(chainId);
  const client = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });

  return client.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [owner, spender],
  });
}

export function getSwapRouterAddress(chainId: SupportedChain): Address {
  const address = SWAP_ROUTER_ADDRESSES[chainId];
  if (!address) {
    throw new Error(`No swap router for chain ${chainId}`);
  }
  return address;
}
