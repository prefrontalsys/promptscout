import type { HistoryEntry } from "../types.js";
import { DEFAULT_HISTORY_LIMIT } from "../constants.js";
import { getDatabase } from "./database.js";

export class HistoryRepo {
  create(entry: Omit<HistoryEntry, "id" | "created_at">): HistoryEntry {
    const db = getDatabase();
    const result = db
      .prepare(
        `INSERT INTO history (directory, template_name, raw_input, improved_output, final_output)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        entry.directory,
        entry.template_name,
        entry.raw_input,
        entry.improved_output,
        entry.final_output
      );
    return db
      .prepare("SELECT * FROM history WHERE id = ?")
      .get(result.lastInsertRowid) as HistoryEntry;
  }

  list(
    directory?: string,
    limit: number = DEFAULT_HISTORY_LIMIT
  ): HistoryEntry[] {
    const db = getDatabase();
    if (directory) {
      return db
        .prepare(
          "SELECT * FROM history WHERE directory = ? ORDER BY created_at DESC LIMIT ?"
        )
        .all(directory, limit) as HistoryEntry[];
    }
    return db
      .prepare("SELECT * FROM history ORDER BY created_at DESC LIMIT ?")
      .all(limit) as HistoryEntry[];
  }

  findById(id: number): HistoryEntry | undefined {
    const db = getDatabase();
    return db
      .prepare("SELECT * FROM history WHERE id = ?")
      .get(id) as HistoryEntry | undefined;
  }

  clear(): void {
    const db = getDatabase();
    db.prepare("DELETE FROM history").run();
  }
}
