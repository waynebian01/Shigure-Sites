import { getShare, storageBindings } from "../../../../lib/shares";
import { getCurrentUser } from "../../../../lib/auth";

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
