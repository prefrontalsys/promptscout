import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { templates } from "./schema.js";

export class TemplateRepo {
  constructor(private db: BetterSQLite3Database) {}

  get(directory: string): { directory: string; content: string } | undefined {
    return this.db
      .select()
      .from(templates)
      .where(eq(templates.directory, directory))
      .get();
  }

  upsert(directory: string, content: string): void {
    this.db
      .insert(templates)
      .values({ directory, content })
      .onConflictDoUpdate({
        target: templates.directory,
        set: { content, updated_at: new Date().toISOString() },
      })
      .run();
  }

  delete(directory: string): boolean {
    const result = this.db
      .delete(templates)
      .where(eq(templates.directory, directory))
      .run();
    return result.changes > 0;
  }

  list(): { directory: string; content: string }[] {
    return this.db.select().from(templates).all();
  }
}
