import type { DatabaseType } from "./db/database.js"

export type Config = {
  port: number
  apiKey: string
  rpcUrl: string
  bundlerUrl: string
  zerodevProjectId: string
  defaultChainId: number
  rateLimitMaxTokens: number
  rateLimitRefillRate: number
  wsHeartbeatInterval: number
  version: string
  dbType: DatabaseType
  dbUrl: string
}

export function createConfig(overrides?: Partial<Config>): Config {
  return {
    port: parseInt(process.env.PORT || "3001", 10),
    apiKey: process.env.API_KEY || "sigloop-dev-key",
    rpcUrl: process.env.RPC_URL || "http://localhost:8545",
    bundlerUrl: process.env.BUNDLER_URL || "",
    zerodevProjectId: process.env.ZERODEV_PROJECT_ID || "",
    defaultChainId: parseInt(process.env.DEFAULT_CHAIN_ID || "8453", 10),
    rateLimitMaxTokens: 100,
    rateLimitRefillRate: 10,
    wsHeartbeatInterval: 30000,
    version: "0.1.0",
    dbType: (process.env.DB_TYPE as DatabaseType) || "memory",
    dbUrl: process.env.DB_URL || "",
    ...overrides,
  }
}
