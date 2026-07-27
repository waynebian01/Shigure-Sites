import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureStorage, storageBindings } from "./shares";

const SESSION_COOKIE = "shigure_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_ITERATIONS = 210_000;
const encoder = new TextEncoder();

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  createdAt: number;
  isAdmin: boolean;
};

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string) {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) return new Uint8Array();
  return new Uint8Array(value.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
}

function randomHex(bytes: number) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return toHex(value);
}

async function sha256(value: string) {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

async function derivePassword(password: string, saltHex: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: fromHex(saltHex),
      iterations: PASSWORD_ITERATIONS,
    },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validateCredentials(usernameInput: string, password: string) {
  const username = normalizeUsername(usernameInput);
  if (username.length < 3 || username.length > 24) {
    throw new AuthError("账号需为 3–24 个字符");
  }
  if (!/^[\p{L}\p{N}_-]+$/u.test(username)) {
    throw new AuthError("账号仅支持文字、数字、下划线和连字符");
  }
  if (password.length < 8 || password.length > 128) {
    throw new AuthError("密码需为 8–128 个字符");
  }
  return username;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  if (new URL(origin).host !== new URL(request.url).host) {
    throw new AuthError("请求来源无效", 403);
  }
}

function mapUser(row: Record<string, unknown>): AuthUser {
  return {
    id: String(row.id),
    username: String(row.username),
    displayName: String(row.display_name),
    createdAt: Number(row.created_at),
    isAdmin: Boolean(row.is_admin),
  };
}

async function isSecureRequest() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const protocol = requestHeaders.get("x-forwarded-proto");
  return protocol ? protocol === "https" : !host.includes("localhost");
}

async function createSession(userId: string) {
  await ensureStorage();
  const { DB } = storageBindings();
  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  await DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now).run();
  await DB.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
  ).bind(crypto.randomUUID(), userId, tokenHash, expiresAt, now).run();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isSecureRequest(),
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function register(usernameInput: string, password: string) {
  const username = validateCredentials(usernameInput, password);
  await ensureStorage();
  const { DB } = storageBindings();
  const existing = await DB.prepare("SELECT id FROM users WHERE username = ?")
    .bind(username)
    .first();
  if (existing) throw new AuthError("这个账号已被使用", 409);

  const salt = randomHex(16);
  const passwordHash = await derivePassword(password, salt);
  const id = crypto.randomUUID();
  try {
    await DB.prepare(`INSERT INTO users
      (id, email, username, display_name, password_hash, password_salt, failed_attempts, is_admin, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)`)
      .bind(id, `local:${username}`, username, usernameInput.trim(), passwordHash, salt, Date.now())
      .run();
  } catch (error) {
    console.error(error);
    throw new AuthError("这个账号已被使用", 409);
  }
  await createSession(id);
  return { id, username };
}

export async function login(usernameInput: string, password: string) {
  const username = normalizeUsername(usernameInput);
  if (!username || !password) throw new AuthError("请输入账号和密码");
  await ensureStorage();
  const { DB } = storageBindings();
  const row = await DB.prepare("SELECT * FROM users WHERE username = ?")
    .bind(username)
    .first<Record<string, unknown>>();
  const genericError = new AuthError("账号或密码错误", 401);
  if (!row?.password_hash || !row.password_salt) throw genericError;

  const now = Date.now();
  if (Number(row.locked_until ?? 0) > now) {
    throw new AuthError("登录尝试过多，请稍后再试", 429);
  }
  const derived = await derivePassword(password, String(row.password_salt));
  if (!safeEqual(derived, String(row.password_hash))) {
    const attempts = Number(row.failed_attempts ?? 0) + 1;
    const lockedUntil = attempts >= 5 ? now + 10 * 60 * 1000 : null;
    await DB.prepare("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?")
      .bind(attempts >= 5 ? 0 : attempts, lockedUntil, String(row.id))
      .run();
    throw genericError;
  }
  await DB.prepare("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?")
    .bind(String(row.id))
    .run();
  await createSession(String(row.id));
  return mapUser(row);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  await ensureStorage();
  const { DB } = storageBindings();
  const tokenHash = await sha256(token);
  const row = await DB.prepare(`SELECT users.*
    FROM sessions
    INNER JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?`)
    .bind(tokenHash, Date.now())
    .first<Record<string, unknown>>();
  return row?.username ? mapUser(row) : null;
}

export async function requireCurrentUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fprofile");
  return user;
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await ensureStorage();
    await storageBindings().DB.prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(await sha256(token))
      .run();
  }
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: await isSecureRequest(),
    path: "/",
    maxAge: 0,
  });
}
