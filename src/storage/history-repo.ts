import { eq, desc, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { history } from "./schema.js";
import type { HistoryEntry } from "../types.js";
import { DEFAULT_HISTORY_LIMIT } from "../constants.js";

export class HistoryRepo {
  constructor(private db: BetterSQLite3Database) {}

  create(entry: Omit<HistoryEntry, "id" | "created_at">): HistoryEntry {
    const result = this.db
      .insert(history)
      .values({
        directory: entry.directory,
        raw_input: entry.raw_input,
        improved_output: entry.improved_output,
        final_output: entry.final_output,
        model_name: entry.model_name,
      })
      .run();

    return this.db
      .select()
      .from(history)
      .where(eq(history.id, Number(result.lastInsertRowid)))
      .get() as HistoryEntry;
  }

  list(directory?: string, limit: number = DEFAULT_HISTORY_LIMIT): HistoryEntry[] {
    const query = this.db
      .select()
      .from(history)
      .orderBy(desc(history.created_at))
      .limit(limit);

    if (directory) {
      return query.where(eq(history.directory, directory)).all() as HistoryEntry[];
    }
    return query.all() as HistoryEntry[];
  }

  findById(id: number): HistoryEntry | undefined {
    return this.db
      .select()
      .from(history)
      .where(eq(history.id, id))
      .get() as HistoryEntry | undefined;
  }

  clear(): void {
    this.db.delete(history).run();
  }
}
