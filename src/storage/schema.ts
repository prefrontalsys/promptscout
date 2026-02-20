import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const history = sqliteTable("history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  directory: text("directory").notNull(),
  raw_input: text("raw_input").notNull(),
  improved_output: text("improved_output").notNull(),
  final_output: text("final_output").notNull(),
  model_name: text("model_name"),
  created_at: text("created_at").default(sql`(datetime('now'))`),
});

export const config = sqliteTable("config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const templates = sqliteTable("templates", {
  directory: text("directory").primaryKey(),
  content: text("content").notNull(),
  created_at: text("created_at").default(sql`(datetime('now'))`),
  updated_at: text("updated_at").default(sql`(datetime('now'))`),
});
