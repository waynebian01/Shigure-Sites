import { getShare, storageBindings } from "../../../../lib/shares";
import { getCurrentUser } from "../../../../lib/auth";
import { validateModuleJson } from "../../../../lib/module-json";
import { getModuleMetadata } from "../../../../lib/module-metadata";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const share = await getShare(id);
    if (!share) return Response.json({ error: "没有找到这份分享" }, { status: 404 });
    const object = await storageBindings().FILES.get(share.r2Key);
    if (!object) return Response.json({ error: "文件内容不存在" }, { status: 404 });
    const content = JSON.parse(await object.text());
    return Response.json({ content });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "暂时无法读取文件" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "请先登录" }, { status: 401 });

    const { id } = await context.params;
    const share = await getShare(id);
    if (!share) return Response.json({ error: "没有找到这份分享" }, { status: 404 });
    if (!user.isAdmin && share.ownerUserId !== user.id) {
      return Response.json({ error: "你只能更新自己分享的 JSON" }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "请选择一个 JSON 文件" }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".json")) return Response.json({ error: "仅支持 .json 文件" }, { status: 415 });
    if (file.size > 200 * 1024) return Response.json({ error: "文件大小不能超过 200 KB" }, { status: 413 });
    if (file.size === 0) return Response.json({ error: "不能使用空文件更新" }, { status: 400 });

    const text = await file.text();
    const validation = validateModuleJson(text);
    if (!validation.ok) return Response.json({ error: validation.error }, { status: 400 });
    const metadata = getModuleMetadata(validation.content);
    if (metadata.classSpecializationError) {
      return Response.json({ error: metadata.classSpecializationError }, { status: 400 });
    }

    const safeFilename = file.name.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff]/g, "-").slice(0, 100) || "shared.json";
    const r2Key = `shares/${id}/${safeFilename}`;
    const { DB, FILES } = storageBindings();
    await FILES.put(r2Key, text, { httpMetadata: { contentType: "application/json; charset=utf-8" } });
    await DB.prepare(`UPDATE shares SET filename = ?, author = ?, version = ?, profession = ?, specialization = ?, size = ?, r2_key = ? WHERE id = ?`)
      .bind(safeFilename, metadata.author, metadata.version, metadata.profession, metadata.specialization, new TextEncoder().encode(text).byteLength, r2Key, id)
      .run();
    if (r2Key !== share.r2Key) await FILES.delete(share.r2Key);

    return Response.json({ updated: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "更新失败，请稍后重试" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "请先登录" }, { status: 401 });

    const { id } = await context.params;
    const share = await getShare(id);
    if (!share) return Response.json({ error: "没有找到这份分享" }, { status: 404 });
    if (!user.isAdmin && share.ownerUserId !== user.id) {
      return Response.json({ error: "你只能更新自己分享的描述" }, { status: 403 });
    }

    const body = (await request.json()) as { description?: string };
    const description = body.description?.trim() ?? "";
    if (!description) return Response.json({ error: "请填写文件描述" }, { status: 400 });
    if (description.length > 240) return Response.json({ error: "描述内容过长，请精简后重试" }, { status: 400 });

    await storageBindings().DB.prepare("UPDATE shares SET description = ? WHERE id = ?")
      .bind(description, id)
      .run();
    return Response.json({ updated: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "描述更新失败，请稍后重试" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await context.params;
    const share = await getShare(id);
    if (!share) {
      return Response.json({ error: "没有找到这份分享" }, { status: 404 });
    }
    if (!user.isAdmin && share.ownerUserId !== user.id) {
      return Response.json({ error: "你只能删除自己分享的 JSON" }, { status: 403 });
    }

    const { DB, FILES } = storageBindings();
    await DB.prepare("DELETE FROM shares WHERE id = ?").bind(id).run();
    await FILES.delete(share.r2Key);

    return Response.json({ deleted: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "删除失败，请稍后重试" }, { status: 500 });
  }
}
