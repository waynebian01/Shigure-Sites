import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const shares = sqliteTable("shares", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  author: text("author").notNull(),
  version: text("version").notNull(),
  profession: text("profession").notNull(),
  specialization: text("specialization").notNull(),
  description: text("description").notNull(),
  size: integer("size").notNull(),
  r2Key: text("r2_key").notNull(),
  createdAt: integer("created_at").notNull(),
});
