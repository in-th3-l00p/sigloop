import type { Address, Abi } from "viem"

export const UNISWAP_V3_ROUTER: Record<number, Address> = {
  1: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  10: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  137: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  42161: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  8453: "0x2626664c2603336E57B271c5C0b26F421741e481",
  11155111: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
}

export const AAVE_V3_POOL: Record<number, Address> = {
  1: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  10: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  137: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  42161: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  8453: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
}

export const DEFAULT_POOL_FEE = 3000

export const DEFAULT_DEADLINE_OFFSET = 1200

export const ACTION_TYPE_MAP: Record<string, number> = {
  swap: 0,
  supply: 1,
  borrow: 2,
  repay: 3,
  stake: 4,
  unstake: 5,
}

export const UNISWAP_V3_ROUTER_ABI = [
  {
    type: "function",
    name: "exactInputSingle",
    inputs: [
      {
        name: "params",
        type: "tuple",
        internalType: "struct IV3SwapRouter.ExactInputSingleParams",
        components: [
          { name: "tokenIn", type: "address", internalType: "address" },
          { name: "tokenOut", type: "address", internalType: "address" },
          { name: "fee", type: "uint24", internalType: "uint24" },
          { name: "recipient", type: "address", internalType: "address" },
          { name: "amountIn", type: "uint256", internalType: "uint256" },
          { name: "amountOutMinimum", type: "uint256", internalType: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160", internalType: "uint160" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256", internalType: "uint256" }],
    stateMutability: "payable",
  },
] as const satisfies Abi

export const AAVE_V3_POOL_ABI = [
  {
    type: "function",
    name: "supply",
    inputs: [
      { name: "asset", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "onBehalfOf", type: "address", internalType: "address" },
      { name: "referralCode", type: "uint16", internalType: "uint16" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "borrow",
    inputs: [
      { name: "asset", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "interestRateMode", type: "uint256", internalType: "uint256" },
      { name: "referralCode", type: "uint16", internalType: "uint16" },
      { name: "onBehalfOf", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "repay",
    inputs: [
      { name: "asset", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "interestRateMode", type: "uint256", internalType: "uint256" },
      { name: "onBehalfOf", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
] as const satisfies Abi

export const ERC20_APPROVE_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
] as const satisfies Abi

export const DEFI_EXECUTOR_ABI = [
  {
    type: "function",
    name: "executeFromExecutor",
    inputs: [
      { name: "target", type: "address", internalType: "address" },
      { name: "value", type: "uint256", internalType: "uint256" },
      { name: "data", type: "bytes", internalType: "bytes" },
    ],
    outputs: [{ name: "", type: "bytes", internalType: "bytes" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isModuleType",
    inputs: [{ name: "typeId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "pure",
  },
] as const satisfies Abi
