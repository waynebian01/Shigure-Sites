import { env } from "cloudflare:workers";

export type ShareRecord = {
  id: string;
  filename: string;
  author: string;
  version: string;
  profession: string;
  specialization: string;
  description: string;
  size: number;
  r2Key: string;
  createdAt: number;
};

type RuntimeEnv = { DB: D1Database; FILES: R2Bucket };

function bindings() {
  const runtime = env as unknown as Partial<RuntimeEnv>;
  if (!runtime.DB || !runtime.FILES) throw new Error("存储服务尚未就绪");
  return runtime as RuntimeEnv;
}

const seedFiles = [
  {
    id: "starter-ui-tokens",
    filename: "戒律队伍神谕者.json",
    author: "Wayne",
    version: "1.1.0",
    profession: "牧师",
    specialization: "戒律",
    description: "适用于戒律牧师队伍治疗的神谕者模块示例，包含职业、专精、队伍类型和英雄天赋匹配信息。",
    content: { Id: "新模块1-20260612100954681", Name: "戒律队伍神谕者", Author: "Wayne", Version: "1.1.0", Enabled: true, Match: { ClassId: 5, SpecId: 1, PartyType: "46", HeroTalent: 1 }, Units: [{ Name: "无盾坦克", Kind: "UnitWithRoleWithoutAura", Role: 1, Reverse: false, AuraNames: ["真言术：盾"] }] },
    createdAt: Date.UTC(2026, 6, 18, 9, 24),
  },
  {
    id: "starter-eslint-profile",
    filename: "防护圣骑士队伍.json",
    author: "Mori",
    version: "1.8.0",
    profession: "圣骑士",
    specialization: "防护",
    description: "防护圣骑士的队伍状态判断示例，包含基础匹配条件和低血量队友统计。",
    content: { Id: "prot-paladin-party-20260717", Name: "防护圣骑士队伍", Author: "Mori", Version: "1.8.0", Enabled: true, Match: { ClassId: 2, SpecId: 2, PartyType: "46" }, Counts: [{ Name: "C80", Kind: "UnitsBelowHealth", HealthThreshold: 80 }] },
    createdAt: Date.UTC(2026, 6, 17, 14, 12),
  },
  {
    id: "starter-data-pipeline",
    filename: "恢复德鲁伊团本.json",
    author: "苏航",
    version: "3.1.2",
    profession: "德鲁伊",
    specialization: "恢复",
    description: "恢复德鲁伊团本模块示例，用于识别持续治疗效果缺失与队伍血量阈值。",
    content: { Id: "resto-druid-raid-20260716", Name: "恢复德鲁伊团本", Author: "苏航", Version: "3.1.2", Enabled: true, Match: { ClassId: 11, SpecId: 4, PartyType: "40" }, Units: [{ Name: "无回春最低", Kind: "LowestHealthWithoutAura", AuraNames: ["回春术"] }] },
    createdAt: Date.UTC(2026, 6, 16, 11, 45),
  },
  {
    id: "starter-release-flow",
    filename: "奥术法师爆发.json",
    author: "北川",
    version: "1.3.5",
    profession: "法师",
    specialization: "奥术",
    description: "奥术法师爆发窗口示例，依据资源与增益状态组织一组简洁的判断条件。",
    content: { Id: "arcane-burst-20260715", Name: "奥术法师爆发", Author: "北川", Version: "1.3.5", Enabled: true, Match: { ClassId: 8, SpecId: 1 }, Conditions: [{ Name: "奥术充能", Kind: "PowerAbove", Threshold: 3 }] },
    createdAt: Date.UTC(2026, 6, 15, 8, 30),
  },
];

export async function ensureStorage() {
  const { DB, FILES } = bindings();
  await DB.batch([
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
      created_at INTEGER NOT NULL
    )`),
    DB.prepare("CREATE INDEX IF NOT EXISTS shares_created_at_idx ON shares (created_at DESC)"),
  ]);

  const count = await DB.prepare("SELECT COUNT(*) AS total FROM shares").first<{ total: number }>();
  if (Number(count?.total ?? 0) > 0) return;

  const encoder = new TextEncoder();
  const rows = [];
  for (const seed of seedFiles) {
    const text = JSON.stringify(seed.content, null, 2);
    const bytes = encoder.encode(text);
    const r2Key = `shares/${seed.id}/${seed.filename}`;
    await FILES.put(r2Key, bytes, { httpMetadata: { contentType: "application/json; charset=utf-8" } });
    rows.push(DB.prepare(`INSERT OR IGNORE INTO shares
      (id, filename, author, version, profession, specialization, description, size, r2_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(seed.id, seed.filename, seed.author, seed.version, seed.profession, seed.specialization, seed.description, bytes.byteLength, r2Key, seed.createdAt));
  }
  await DB.batch(rows);
}

function mapRow(row: Record<string, unknown>): ShareRecord {
  return {
    id: String(row.id),
    filename: String(row.filename),
    author: String(row.author),
    version: String(row.version),
    profession: String(row.profession),
    specialization: String(row.specialization),
    description: String(row.description),
    size: Number(row.size),
    r2Key: String(row.r2_key),
    createdAt: Number(row.created_at),
  };
}

export async function listShares() {
  await ensureStorage();
  const { DB } = bindings();
  const result = await DB.prepare("SELECT * FROM shares ORDER BY created_at DESC LIMIT 100").all();
  return result.results.map((row) => mapRow(row as Record<string, unknown>));
}

export async function getShare(id: string) {
  await ensureStorage();
  const { DB } = bindings();
  const row = await DB.prepare("SELECT * FROM shares WHERE id = ?").bind(id).first<Record<string, unknown>>();
  return row ? mapRow(row) : null;
}

export function storageBindings() {
  return bindings();
}
