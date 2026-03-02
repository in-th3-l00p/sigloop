import type { Database } from "./database.js"

export function createPostgresDatabase(_connectionString: string): Database {
  throw new Error(
    "Postgres support requires async store implementations. " +
    "Set DB_TYPE=sqlite for file-based persistence or DB_TYPE=memory for in-memory storage. " +
    "To add postgres: create async store variants that use pg.Pool with parameterized queries ($1, $2, etc.).",
  )
}
