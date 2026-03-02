import { createSqliteDatabase } from "./sqlite.js"
import type { Database } from "./database.js"

export function createMemoryDatabase(): Database {
  return createSqliteDatabase(":memory:")
}
