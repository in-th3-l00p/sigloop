export const SpendingLimitHookAbi = [
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
    name: "preCheck",
    inputs: [
      { name: "msgSender", type: "address", internalType: "address" },
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
        internalType: "struct SpendingRecord",
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
] as const;
