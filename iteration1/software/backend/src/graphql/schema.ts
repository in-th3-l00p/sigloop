export const typeDefs = /* GraphQL */ `
  type Wallet {
    id: ID!
    address: String!
    name: String!
    chainId: Int!
    createdAt: String!
    updatedAt: String!
  }

  type Agent {
    id: ID!
    walletId: ID!
    name: String!
    address: String!
    policyId: ID
    status: String!
    expiresAt: Int!
    createdAt: String!
    updatedAt: String!
    revokedAt: String
  }

  type AgentWithSessionKey {
    agent: Agent!
    sessionKey: String!
  }

  type Policy {
    id: ID!
    name: String!
    type: String!
    config: JSON!
    createdAt: String!
    updatedAt: String!
  }

  type Payment {
    id: ID!
    agentId: ID!
    walletId: ID!
    domain: String!
    amount: String!
    currency: String!
    asset: String!
    status: String!
    txHash: String
    metadata: JSON
    createdAt: String!
  }

  type AgentStat {
    spent: String!
    count: Int!
  }

  type DomainStat {
    spent: String!
    count: Int!
  }

  type PeriodStat {
    period: String!
    spent: String!
    count: Int!
  }

  type PaymentStats {
    totalSpent: String!
    totalTransactions: Int!
    byAgent: JSON!
    byDomain: JSON!
    byPeriod: [PeriodStat!]!
  }

  type BudgetState {
    walletId: ID!
    totalSpent: String!
    dailySpent: String!
    lastDailyReset: Int!
    remaining: String!
  }

  type EncodedCall {
    to: String!
    data: String!
    value: String!
  }

  type ApproveCall {
    to: String!
    data: String!
  }

  type SessionStatus {
    active: Boolean!
    expiresAt: Int!
    remainingSeconds: Int!
  }

  type SignatureResult {
    signature: String!
  }

  type TransactionResult {
    txHash: String!
  }

  type BudgetCheck {
    allowed: Boolean!
    reason: String
  }

  type SpendingDataPoint {
    period: String!
    totalSpent: String!
    transactionCount: Int!
  }

  type AgentActivity {
    agentId: ID!
    name: String!
    walletId: ID!
    totalSpent: String!
    transactionCount: Int!
    lastActive: String
    domains: [String!]!
  }

  scalar JSON

  input CreateWalletInput {
    name: String!
    chainId: Int
  }

  input CreateAgentInput {
    name: String!
    policyId: ID
    sessionDuration: Int
  }

  input CreatePolicyInput {
    name: String!
    type: String!
    config: JSON!
  }

  input UpdatePolicyInput {
    name: String
    type: String
    config: JSON
  }

  input RecordPaymentInput {
    agentId: ID!
    walletId: ID!
    domain: String!
    amount: String!
    currency: String
    asset: String
    metadata: JSON
  }

  input PaymentFiltersInput {
    agentId: ID
    walletId: ID
    domain: String
    startDate: String
    endDate: String
  }

  input SpendingFiltersInput {
    period: String
    startDate: String
    endDate: String
    walletId: ID
    agentId: ID
  }

  input AgentActivityFiltersInput {
    walletId: ID
    limit: Int
    sortBy: String
  }

  input SwapInput {
    chainId: Int!
    tokenIn: String!
    tokenOut: String!
    amountIn: String!
    minAmountOut: String!
    recipient: String!
    router: String
    fee: Int
  }

  input LendingInput {
    chainId: Int!
    asset: String!
    amount: String!
    onBehalfOf: String!
    pool: String
    interestRateMode: Int
  }

  input ApproveInput {
    token: String!
    spender: String!
    amount: String!
  }

  type Query {
    wallet(id: ID!): Wallet
    wallets: [Wallet!]!
    agent(id: ID!): Agent
    agents(walletId: ID): [Agent!]!
    policy(id: ID!): Policy
    policies: [Policy!]!
    payments(filters: PaymentFiltersInput): [Payment!]!
    paymentStats: PaymentStats!
    budget(walletId: ID!): BudgetState!
    agentPolicy(agentId: ID!): JSON
    agentSession(agentId: ID!): SessionStatus!
    spendingAnalytics(filters: SpendingFiltersInput): [SpendingDataPoint!]!
    agentAnalytics(filters: AgentActivityFiltersInput): [AgentActivity!]!
  }

  type Mutation {
    createWallet(input: CreateWalletInput!): Wallet!
    deleteWallet(id: ID!): Boolean!
    signMessage(walletId: ID!, message: String!): SignatureResult!
    sendTransaction(walletId: ID!, to: String!, value: String, data: String): TransactionResult!
    createAgent(walletId: ID!, input: CreateAgentInput!): AgentWithSessionKey!
    revokeAgent(id: ID!): Agent!
    deleteAgent(id: ID!): Boolean!
    signUserOp(agentId: ID!, userOpHash: String!): SignatureResult!
    createPolicy(input: CreatePolicyInput!): Policy!
    updatePolicy(id: ID!, input: UpdatePolicyInput!): Policy!
    deletePolicy(id: ID!): Boolean!
    encodePolicy(id: ID!): String!
    composePolicies(policyIds: [ID!]!): Policy!
    recordPayment(input: RecordPaymentInput!): Payment!
    checkBudget(walletId: ID!, amount: String!, domain: String): BudgetCheck!
    encodeSwap(input: SwapInput!): EncodedCall!
    encodeSupply(input: LendingInput!): EncodedCall!
    encodeBorrow(input: LendingInput!): EncodedCall!
    encodeRepay(input: LendingInput!): EncodedCall!
    encodeApprove(input: ApproveInput!): ApproveCall!
  }
`
