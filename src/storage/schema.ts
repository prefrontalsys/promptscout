import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const templates = sqliteTable("templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").unique().notNull(),
  content: text("content").notNull(),
  created_at: text("created_at").default(sql`(datetime('now'))`),
  updated_at: text("updated_at").default(sql`(datetime('now'))`),
});

export const history = sqliteTable("history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  directory: text("directory").notNull(),
  template_name: text("template_name"),
  raw_input: text("raw_input").notNull(),
  improved_output: text("improved_output").notNull(),
  final_output: text("final_output").notNull(),
  created_at: text("created_at").default(sql`(datetime('now'))`),
});

export const config = sqliteTable("config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
