import type { Database, DatabaseType } from "./database.js"
import { initSchema } from "./database.js"
import { createSqliteDatabase } from "./sqlite.js"
import { createMemoryDatabase } from "./memory.js"

export type { Database, DatabaseType }
export { initSchema }

export function createDatabase(type: DatabaseType, url?: string): Database {
  switch (type) {
    case "sqlite":
      return createSqliteDatabase(url || "sigloop.db")
    case "memory":
      return createMemoryDatabase()
    case "postgres":
      throw new Error(
        "Postgres requires an async adapter. Use DB_TYPE=sqlite for synchronous operation or implement an async store layer for postgres.",
      )
    default:
      return createMemoryDatabase()
  }
}
