import { env } from "cloudflare:workers";
import { getModuleMetadata } from "./module-metadata";
import { seedModules } from "./seed-modules";

export type ShareRecord = {
  id: string;
  filename: string;
  sharer: string;
  author: string;
  version: string;
  profession: string;
  specialization: string;
  description: string;
  size: number;
  r2Key: string;
  createdAt: number;
  expiresAt: number | null;
  ownerUserId: string | null;
};

type RuntimeEnv = { DB: D1Database; FILES: R2Bucket };

const SEED_VERSION = "2026-07-27-official-one-button-only-v3";

function bindings() {
  const runtime = env as unknown as Partial<RuntimeEnv>;
  if (!runtime.DB || !runtime.FILES) throw new Error("存储服务尚未就绪");
  return runtime as RuntimeEnv;
}

async function replaceBuiltInSamples() {
  const { DB, FILES } = bindings();
  const currentSeed = await DB.prepare("SELECT value FROM app_metadata WHERE key = ?")
    .bind("seed_version")
    .first<{ value: string }>();
  if (currentSeed?.value === SEED_VERSION) return;

  const previousSamples = await DB.prepare(
    "SELECT r2_key FROM shares WHERE id LIKE 'starter-%' OR id LIKE 'sample-%'",
  ).all<{ r2_key: string }>();
  await Promise.all(
    previousSamples.results.map((sample: { r2_key: string }) =>
      FILES.delete(String(sample.r2_key)).catch(() => undefined),
    ),
  );
  await DB.prepare("DELETE FROM shares WHERE id LIKE 'starter-%' OR id LIKE 'sample-%'").run();

  const encoder = new TextEncoder();
  const rows = [];
  for (const seed of seedModules) {
    const metadata = getModuleMetadata(seed.content);
    const text = JSON.stringify(seed.content, null, 2);
    const bytes = encoder.encode(text);
    const r2Key = `shares/${seed.id}/${seed.filename}`;
    await FILES.put(r2Key, bytes, { httpMetadata: { contentType: "application/json; charset=utf-8" } });
    rows.push(
      DB.prepare(`INSERT OR REPLACE INTO shares
        (id, filename, author, version, profession, specialization, description, size, r2_key, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          seed.id,
          seed.filename,
          metadata.author,
          metadata.version,
          metadata.profession,
          metadata.specialization,
          seed.description,
          bytes.byteLength,
          r2Key,
          seed.createdAt,
        ),
    );
  }
  if (rows.length > 0) await DB.batch(rows);
  await DB.prepare(`INSERT INTO app_metadata (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`)
    .bind("seed_version", SEED_VERSION)
    .run();
}

export async function ensureStorage() {
  const { DB } = bindings();
  await DB.batch([
    DB.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      username TEXT UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT,
      password_salt TEXT,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`),
    DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    DB.prepare(`CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      author TEXT NOT NULL,
      version TEXT NOT NULL,
      profession TEXT NOT NULL,
      specialization TEXT NOT NULL,
      description TEXT NOT NULL,
      size INTEGER NOT NULL,
      r2_key TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      owner_user_id TEXT REFERENCES users(id)
    )`),
    DB.prepare("CREATE INDEX IF NOT EXISTS shares_created_at_idx ON shares (created_at DESC)"),
    DB.prepare(`CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`),
  ]);
  const userColumns = await DB.prepare("PRAGMA table_info(users)").all<{ name: string }>();
  const userColumnNames = new Set(userColumns.results.map((column: { name: string }) => column.name));
  const userColumnMigrations = [
    ["username", "ALTER TABLE users ADD COLUMN username TEXT"],
    ["password_hash", "ALTER TABLE users ADD COLUMN password_hash TEXT"],
    ["password_salt", "ALTER TABLE users ADD COLUMN password_salt TEXT"],
    ["failed_attempts", "ALTER TABLE users ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0"],
    ["locked_until", "ALTER TABLE users ADD COLUMN locked_until INTEGER"],
    ["is_admin", "ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"],
  ] as const;
  for (const [column, sql] of userColumnMigrations) {
    if (!userColumnNames.has(column)) await DB.prepare(sql).run();
  }
  await DB.batch([
    DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username)"),
    DB.prepare("CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id)"),
    DB.prepare("CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at)"),
  ]);
  const shareColumns = await DB.prepare("PRAGMA table_info(shares)").all<{ name: string }>();
  if (!shareColumns.results.some((column: { name: string }) => column.name === "owner_user_id")) {
    await DB.prepare("ALTER TABLE shares ADD COLUMN owner_user_id TEXT REFERENCES users(id)").run();
  }
  if (!shareColumns.results.some((column: { name: string }) => column.name === "expires_at")) {
    await DB.prepare("ALTER TABLE shares ADD COLUMN expires_at INTEGER").run();
  }
  await DB.batch([
    DB.prepare("CREATE INDEX IF NOT EXISTS shares_owner_user_id_idx ON shares (owner_user_id, created_at DESC)"),
    DB.prepare("CREATE INDEX IF NOT EXISTS shares_expires_at_idx ON shares (expires_at)"),
  ]);
  await replaceBuiltInSamples();
  await purgeExpiredShares();
}

async function purgeExpiredShares() {
  const { DB, FILES } = bindings();
  const now = Date.now();
  const expired = await DB.prepare(
    "SELECT r2_key FROM shares WHERE expires_at IS NOT NULL AND expires_at <= ?",
  ).bind(now).all<{ r2_key: string }>();
  await Promise.all(
    expired.results.map((share: { r2_key: string }) =>
      FILES.delete(String(share.r2_key)).catch(() => undefined),
    ),
  );
  if (expired.results.length > 0) {
    await DB.prepare("DELETE FROM shares WHERE expires_at IS NOT NULL AND expires_at <= ?")
      .bind(now)
      .run();
  }
}

function mapRow(row: Record<string, unknown>): ShareRecord {
  return {
    id: String(row.id),
    filename: String(row.filename),
    sharer: row.sharer ? String(row.sharer) : "未知",
    author: String(row.author),
    version: String(row.version),
    profession: String(row.profession),
    specialization: String(row.specialization),
    description: String(row.description),
    size: Number(row.size),
    r2Key: String(row.r2_key),
    createdAt: Number(row.created_at),
    expiresAt: row.expires_at ? Number(row.expires_at) : null,
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : null,
  };
}

export async function listShares() {
  await ensureStorage();
  const { DB } = bindings();
  const result = await DB.prepare(`SELECT shares.*, users.display_name AS sharer
    FROM shares
    LEFT JOIN users ON users.id = shares.owner_user_id
    ORDER BY shares.created_at DESC
    LIMIT 100`).all();
  return result.results.map((row: unknown) => mapRow(row as Record<string, unknown>));
}

export async function getShare(id: string) {
  await ensureStorage();
  const { DB } = bindings();
  const row = await DB.prepare(`SELECT shares.*, users.display_name AS sharer
    FROM shares
    LEFT JOIN users ON users.id = shares.owner_user_id
    WHERE shares.id = ?`)
    .bind(id)
    .first<Record<string, unknown>>();
  return row ? mapRow(row) : null;
}

export async function listSharesByOwner(ownerUserId: string) {
  await ensureStorage();
  const { DB } = bindings();
  const result = await DB.prepare(`SELECT shares.*, users.display_name AS sharer
    FROM shares
    LEFT JOIN users ON users.id = shares.owner_user_id
    WHERE shares.owner_user_id = ?
    ORDER BY shares.created_at DESC
    LIMIT 100`).bind(ownerUserId).all();
  return result.results.map((row: unknown) => mapRow(row as Record<string, unknown>));
}

export function storageBindings() {
  return bindings();
}
