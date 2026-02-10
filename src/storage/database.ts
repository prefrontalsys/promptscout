import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { resolveDbPath } from "../utils/paths.js";
import { DEFAULT_SYSTEM_PROMPT, SYSTEM_PROMPT_KEY } from "../constants.js";

let db: Database.Database | null = null;
let drizzleDb: BetterSQLite3Database | null = null;

function migrate(database: Database.Database): void {
  const version = database.pragma("user_version", { simple: true }) as number;

  if (version < 1) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        directory TEXT NOT NULL,
        template_name TEXT,
        raw_input TEXT NOT NULL,
        improved_output TEXT NOT NULL,
        final_output TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      PRAGMA user_version = 1;
    `);

    database
      .prepare("INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)")
      .run(SYSTEM_PROMPT_KEY, DEFAULT_SYSTEM_PROMPT);
  }
}

export function getDatabase(): Database.Database {
  if (db) return db;

  const dbPath = resolveDbPath();
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}

export function getDrizzle(): BetterSQLite3Database {
  if (drizzleDb) return drizzleDb;
  const sqlite = getDatabase();
  drizzleDb = drizzle({ client: sqlite });
  return drizzleDb;
}
