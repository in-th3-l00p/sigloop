import type { Abi } from "viem"

export const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as const

export const VALIDATOR_MODULE_TYPE = 1n
export const EXECUTOR_MODULE_TYPE = 2n
export const HOOK_MODULE_TYPE = 4n

export const AGENT_PERMISSION_VALIDATOR_ABI = [
  {
    type: "function",
    name: "onInstall",
    inputs: [{ name: "data", type: "bytes", internalType: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "onUninstall",
    inputs: [{ name: "data", type: "bytes", internalType: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addAgent",
    inputs: [
      { name: "agent", type: "address", internalType: "address" },
      {
        name: "policy",
        type: "tuple",
        internalType: "struct AgentPolicy",
        components: [
          { name: "allowedTargets", type: "address[]", internalType: "address[]" },
          { name: "allowedSelectors", type: "bytes4[]", internalType: "bytes4[]" },
          { name: "maxAmountPerTx", type: "uint256", internalType: "uint256" },
          { name: "dailyLimit", type: "uint256", internalType: "uint256" },
          { name: "weeklyLimit", type: "uint256", internalType: "uint256" },
          { name: "validAfter", type: "uint48", internalType: "uint48" },
          { name: "validUntil", type: "uint48", internalType: "uint48" },
          { name: "active", type: "bool", internalType: "bool" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "removeAgent",
    inputs: [{ name: "agent", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPolicy",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
      { name: "agent", type: "address", internalType: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct AgentPolicy",
        components: [
          { name: "allowedTargets", type: "address[]", internalType: "address[]" },
          { name: "allowedSelectors", type: "bytes4[]", internalType: "bytes4[]" },
          { name: "maxAmountPerTx", type: "uint256", internalType: "uint256" },
          { name: "dailyLimit", type: "uint256", internalType: "uint256" },
          { name: "weeklyLimit", type: "uint256", internalType: "uint256" },
          { name: "validAfter", type: "uint48", internalType: "uint48" },
          { name: "validUntil", type: "uint48", internalType: "uint48" },
          { name: "active", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isModuleType",
    inputs: [{ name: "typeId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "pure",
  },
] as const satisfies Abi

export const X402_PAYMENT_POLICY_ABI = [
  {
    type: "function",
    name: "onInstall",
    inputs: [{ name: "data", type: "bytes", internalType: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "onUninstall",
    inputs: [{ name: "data", type: "bytes", internalType: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "configureAgent",
    inputs: [
      { name: "agent", type: "address", internalType: "address" },
      {
        name: "budget",
        type: "tuple",
        internalType: "struct X402PaymentPolicy.X402Budget",
        components: [
          { name: "maxPerRequest", type: "uint256", internalType: "uint256" },
          { name: "dailyBudget", type: "uint256", internalType: "uint256" },
          { name: "totalBudget", type: "uint256", internalType: "uint256" },
          { name: "spent", type: "uint256", internalType: "uint256" },
          { name: "dailySpent", type: "uint256", internalType: "uint256" },
          { name: "lastReset", type: "uint256", internalType: "uint256" },
          { name: "allowedDomains", type: "string[]", internalType: "string[]" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getBudget",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
      { name: "agent", type: "address", internalType: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct X402PaymentPolicy.X402Budget",
        components: [
          { name: "maxPerRequest", type: "uint256", internalType: "uint256" },
          { name: "dailyBudget", type: "uint256", internalType: "uint256" },
          { name: "totalBudget", type: "uint256", internalType: "uint256" },
          { name: "spent", type: "uint256", internalType: "uint256" },
          { name: "dailySpent", type: "uint256", internalType: "uint256" },
          { name: "lastReset", type: "uint256", internalType: "uint256" },
          { name: "allowedDomains", type: "string[]", internalType: "string[]" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRemainingBudget",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
      { name: "agent", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isModuleType",
    inputs: [{ name: "typeId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "pure",
  },
  {
    type: "event",
    name: "PaymentRecorded",
    inputs: [
      { name: "account", type: "address", indexed: true, internalType: "address" },
      { name: "agent", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
] as const satisfies Abi

export const SPENDING_LIMIT_HOOK_ABI = [
  {
    type: "function",
    name: "onInstall",
    inputs: [{ name: "data", type: "bytes", internalType: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "onUninstall",
    inputs: [{ name: "data", type: "bytes", internalType: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setLimits",
    inputs: [
      { name: "agent", type: "address", internalType: "address" },
      { name: "token", type: "address", internalType: "address" },
      { name: "dailyLimit", type: "uint256", internalType: "uint256" },
      { name: "weeklyLimit", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getSpending",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
      { name: "agent", type: "address", internalType: "address" },
      { name: "token", type: "address", internalType: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct SpendingLib.SpendingRecord",
        components: [
          { name: "dailySpent", type: "uint256", internalType: "uint256" },
          { name: "weeklySpent", type: "uint256", internalType: "uint256" },
          { name: "lastDailyReset", type: "uint256", internalType: "uint256" },
          { name: "lastWeeklyReset", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "resetSpending",
    inputs: [
      { name: "agent", type: "address", internalType: "address" },
      { name: "token", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isModuleType",
    inputs: [{ name: "typeId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "pure",
  },
  {
    type: "event",
    name: "SpendingRecorded",
    inputs: [
      { name: "account", type: "address", indexed: true, internalType: "address" },
      { name: "agent", type: "address", indexed: true, internalType: "address" },
      { name: "token", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
] as const satisfies Abi

export const DEFI_EXECUTOR_ABI = [
  {
    type: "function",
    name: "onInstall",
    inputs: [{ name: "data", type: "bytes", internalType: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "onUninstall",
    inputs: [{ name: "data", type: "bytes", internalType: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
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

export const AGENT_POLICY_ABI_PARAMS = [
  {
    type: "tuple",
    components: [
      { name: "allowedTargets", type: "address[]" },
      { name: "allowedSelectors", type: "bytes4[]" },
      { name: "maxAmountPerTx", type: "uint256" },
      { name: "dailyLimit", type: "uint256" },
      { name: "weeklyLimit", type: "uint256" },
      { name: "validAfter", type: "uint48" },
      { name: "validUntil", type: "uint48" },
      { name: "active", type: "bool" },
    ],
  },
] as const

export const X402_BUDGET_ABI_PARAMS = [
  {
    type: "tuple",
    components: [
      { name: "maxPerRequest", type: "uint256" },
      { name: "dailyBudget", type: "uint256" },
      { name: "totalBudget", type: "uint256" },
      { name: "spent", type: "uint256" },
      { name: "dailySpent", type: "uint256" },
      { name: "lastReset", type: "uint256" },
      { name: "allowedDomains", type: "string[]" },
    ],
  },
] as const
