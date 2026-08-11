import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash"),
  passwordSalt: text("password_salt"),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: integer("locked_until"),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

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
    expiresAt: integer("expires_at"),
    ownerUserId: text("owner_user_id").references(() => users.id),
    downloadCount: integer("download_count").notNull().default(0),
  },
  (table) => [
    index("shares_owner_user_id_idx").on(table.ownerUserId, table.createdAt),
    index("shares_expires_at_idx").on(table.expiresAt),
  ],
);
