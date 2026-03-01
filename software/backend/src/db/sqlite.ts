import BetterSqlite3 from "better-sqlite3"
import type { Database } from "./database.js"

export function createSqliteDatabase(path: string): Database {
  const db = new BetterSqlite3(path)
  db.pragma("journal_mode = WAL")
  db.pragma("foreign_keys = ON")

  return {
    exec(sql) {
      db.exec(sql)
    },
    run(sql, params = []) {
      const stmt = db.prepare(sql)
      const result = stmt.run(...params)
      return {
        changes: result.changes,
        lastInsertRowid: Number(result.lastInsertRowid),
      }
    },
    get<T>(sql: string, params: unknown[] = []) {
      const stmt = db.prepare(sql)
      return stmt.get(...params) as T | undefined
    },
    all<T>(sql: string, params: unknown[] = []) {
      const stmt = db.prepare(sql)
      return stmt.all(...params) as T[]
    },
    close() {
      db.close()
    },
  }
}
