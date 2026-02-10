import { DEFAULT_SYSTEM_PROMPT, SYSTEM_PROMPT_KEY } from "../constants.js";
import { getDatabase } from "./database.js";

export class ConfigRepo {
  get(key: string): string | undefined {
    const db = getDatabase();
    const row = db
      .prepare("SELECT value FROM config WHERE key = ?")
      .get(key) as { value: string } | undefined;
    return row?.value;
  }

  set(key: string, value: string): void {
    const db = getDatabase();
    db.prepare(
      "INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(key, value);
  }

  delete(key: string): boolean {
    const db = getDatabase();
    const result = db.prepare("DELETE FROM config WHERE key = ?").run(key);
    return result.changes > 0;
  }

  getSystemPrompt(): string {
    return this.get(SYSTEM_PROMPT_KEY) ?? DEFAULT_SYSTEM_PROMPT;
  }
}
