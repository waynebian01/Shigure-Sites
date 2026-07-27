import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const shares = sqliteTable(
  "shares",
  {
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
    ownerUserId: text("owner_user_id").references(() => users.id),
  },
  (table) => [
    index("shares_owner_user_id_idx").on(table.ownerUserId, table.createdAt),
  ],
);
