import { listShares, storageBindings } from "../../../lib/shares";
import { validateModuleJson } from "../../../lib/module-json";

export const dynamic = "force-dynamic";

function publicShare(share: Awaited<ReturnType<typeof listShares>>[number]) {
  return { ...share, r2Key: undefined, createdAt: new Date(share.createdAt).toISOString() };
}

export async function GET() {
  try {
    const shares = await listShares();
    return Response.json({ shares: shares.map(publicShare) });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "暂时无法读取分享内容" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let r2Key = "";
  try {
    const form = await request.formData();
    const file = form.get("file");
    const fields = {
      author: String(form.get("author") ?? "").trim(),
      version: String(form.get("version") ?? "").trim(),
      profession: String(form.get("profession") ?? "").trim(),
      specialization: String(form.get("specialization") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
    };

    if (!(file instanceof File)) return Response.json({ error: "请选择一个 JSON 文件" }, { status: 400 });
    if (!Object.values(fields).every(Boolean)) return Response.json({ error: "请完整填写作者、版本、职业、专精与描述" }, { status: 400 });
    if (fields.author.length > 40 || fields.version.length > 20 || fields.profession.length > 40 || fields.specialization.length > 40 || fields.description.length > 240) {
      return Response.json({ error: "部分文字内容过长，请精简后重试" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".json")) return Response.json({ error: "仅支持 .json 文件" }, { status: 415 });
    if (file.size > 200 * 1024) return Response.json({ error: "文件大小不能超过 200 KB" }, { status: 413 });
    if (file.size === 0) return Response.json({ error: "不能分享空文件" }, { status: 400 });

    const text = await file.text();
    const validation = validateModuleJson(text);
    if (!validation.ok) return Response.json({ error: validation.error }, { status: 400 });

    const { DB, FILES } = storageBindings();
    const id = crypto.randomUUID();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff]/g, "-").slice(0, 100) || "shared.json";
    r2Key = `shares/${id}/${safeFilename}`;
    await FILES.put(r2Key, text, { httpMetadata: { contentType: "application/json; charset=utf-8" } });
    await DB.prepare(`INSERT INTO shares
      (id, filename, author, version, profession, specialization, description, size, r2_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, safeFilename, fields.author, fields.version, fields.profession, fields.specialization, fields.description, new TextEncoder().encode(text).byteLength, r2Key, Date.now())
      .run();
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (r2Key) await storageBindings().FILES.delete(r2Key).catch(() => undefined);
    return Response.json({ error: "分享失败，请稍后重试" }, { status: 500 });
  }
}
