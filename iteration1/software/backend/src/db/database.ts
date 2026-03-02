export type DatabaseRow = Record<string, unknown>

export type Database = {
  exec: (sql: string) => void
  run: (sql: string, params?: unknown[]) => { changes: number; lastInsertRowid: number }
  get: <T = DatabaseRow>(sql: string, params?: unknown[]) => T | undefined
  all: <T = DatabaseRow>(sql: string, params?: unknown[]) => T[]
  close: () => void
}

export type DatabaseType = "sqlite" | "postgres" | "memory"

export function initSchema(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      address TEXT NOT NULL,
      name TEXT NOT NULL,
      chain_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      wallet_id TEXT NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      session_private_key TEXT NOT NULL,
      policy_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      revoked_at TEXT,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_agents_wallet_id ON agents(wallet_id)
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      wallet_id TEXT NOT NULL,
      domain TEXT NOT NULL,
      amount TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USDC',
      asset TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      tx_hash TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payments_agent_id ON payments(agent_id)
  `)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payments_wallet_id ON payments(wallet_id)
  `)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payments_domain ON payments(domain)
  `)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)
  `)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)
  `)
}
