import type { Template } from "../types.js";
import { getDatabase } from "./database.js";

export class TemplateRepo {
  list(): Template[] {
    const db = getDatabase();
    return db
      .prepare("SELECT * FROM templates ORDER BY name ASC")
      .all() as Template[];
  }

  findByName(name: string): Template | undefined {
    const db = getDatabase();
    return db
      .prepare("SELECT * FROM templates WHERE name = ?")
      .get(name) as Template | undefined;
  }

  create(name: string, content: string): Template {
    const db = getDatabase();
    db.prepare("INSERT INTO templates (name, content) VALUES (?, ?)").run(
      name,
      content
    );
    return this.findByName(name)!;
  }

  update(name: string, content: string): Template {
    const db = getDatabase();
    const result = db
      .prepare(
        "UPDATE templates SET content = ?, updated_at = datetime('now') WHERE name = ?"
      )
      .run(content, name);
    if (result.changes === 0) {
      throw new Error(`Template '${name}' not found`);
    }
    return this.findByName(name)!;
  }

  delete(name: string): boolean {
    const db = getDatabase();
    const result = db.prepare("DELETE FROM templates WHERE name = ?").run(name);
    return result.changes > 0;
  }
}
