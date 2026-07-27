import { listShares, storageBindings } from "../../../lib/shares";
import { validateModuleJson } from "../../../lib/module-json";
import { getModuleMetadata } from "../../../lib/module-metadata";
import { getCurrentUser } from "../../../lib/auth";

export const dynamic = "force-dynamic";

function publicShare(share: Awaited<ReturnType<typeof listShares>>[number]) {
  return {
    ...share,
    r2Key: undefined,
    ownerUserId: undefined,
    createdAt: new Date(share.createdAt).toISOString(),
  };
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
    const owner = await getCurrentUser();
    if (!owner) {
      return Response.json({ error: "请先登录，再分享 JSON" }, { status: 401 });
    }
    const form = await request.formData();
    const file = form.get("file");
    const fields = {
      description: String(form.get("description") ?? "").trim(),
    };

    if (!(file instanceof File)) return Response.json({ error: "请选择一个 JSON 文件" }, { status: 400 });
    if (!fields.description) return Response.json({ error: "请填写文件描述" }, { status: 400 });
    if (fields.description.length > 240) return Response.json({ error: "描述内容过长，请精简后重试" }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".json")) return Response.json({ error: "仅支持 .json 文件" }, { status: 415 });
    if (file.size > 200 * 1024) return Response.json({ error: "文件大小不能超过 200 KB" }, { status: 413 });
    if (file.size === 0) return Response.json({ error: "不能分享空文件" }, { status: 400 });

    const text = await file.text();
    const validation = validateModuleJson(text);
    if (!validation.ok) return Response.json({ error: validation.error }, { status: 400 });
    const metadata = getModuleMetadata(validation.content);
    if (!metadata.hasClassSpecialization) {
      return Response.json({ error: "JSON 缺少有效的职业或专精信息，无法上传" }, { status: 400 });
    }

    const { DB, FILES } = storageBindings();
    const id = crypto.randomUUID();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff]/g, "-").slice(0, 100) || "shared.json";
    r2Key = `shares/${id}/${safeFilename}`;
    await FILES.put(r2Key, text, { httpMetadata: { contentType: "application/json; charset=utf-8" } });
    await DB.prepare(`INSERT INTO shares
      (id, filename, author, version, profession, specialization, description, size, r2_key, created_at, owner_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, safeFilename, metadata.author, metadata.version, metadata.profession, metadata.specialization, fields.description, new TextEncoder().encode(text).byteLength, r2Key, Date.now(), owner.id)
      .run();
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (r2Key) await storageBindings().FILES.delete(r2Key).catch(() => undefined);
    return Response.json({ error: "分享失败，请稍后重试" }, { status: 500 });
  }
}
