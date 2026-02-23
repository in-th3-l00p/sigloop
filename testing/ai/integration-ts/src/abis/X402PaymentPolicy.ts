export const X402PaymentPolicyAbi = [
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
    name: "preCheck",
    inputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "uint256", internalType: "uint256" },
      { name: "msgData", type: "bytes", internalType: "bytes" },
    ],
    outputs: [{ name: "", type: "bytes", internalType: "bytes" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "postCheck",
    inputs: [{ name: "hookData", type: "bytes", internalType: "bytes" }],
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
] as const;
