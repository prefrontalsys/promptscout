import { eq, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { templates } from "./schema.js";
import type { Template } from "../types.js";

export class TemplateRepo {
  constructor(private db: BetterSQLite3Database) {}

  list(): Template[] {
    return this.db
      .select()
      .from(templates)
      .orderBy(templates.name)
      .all() as Template[];
  }

  findByName(name: string): Template | undefined {
    return this.db
      .select()
      .from(templates)
      .where(eq(templates.name, name))
      .get() as Template | undefined;
  }

  create(name: string, content: string): Template {
    this.db.insert(templates).values({ name, content }).run();
    return this.findByName(name)!;
  }

  update(name: string, content: string): Template {
    const result = this.db
      .update(templates)
      .set({ content, updated_at: sql`datetime('now')` })
      .where(eq(templates.name, name))
      .run();
    if (result.changes === 0) {
      throw new Error(`Template '${name}' not found`);
    }
    return this.findByName(name)!;
  }

  delete(name: string): boolean {
    const result = this.db
      .delete(templates)
      .where(eq(templates.name, name))
      .run();
    return result.changes > 0;
  }
}
