import { ensureStorage, storageBindings } from "./shares";

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  createdAt: number;
};

function mapUser(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name),
    createdAt: Number(row.created_at),
  };
}

export async function ensureUser(input: { email: string; displayName: string }) {
  await ensureStorage();
  const { DB } = storageBindings();
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim() || email;

  await DB.prepare(`INSERT INTO users (id, email, display_name, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name`)
    .bind(crypto.randomUUID(), email, displayName, Date.now())
    .run();

  const row = await DB.prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first<Record<string, unknown>>();
  if (!row) throw new Error("无法创建用户档案");
  return mapUser(row);
}
