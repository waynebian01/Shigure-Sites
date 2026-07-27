import { getShare, storageBindings } from "../../../../lib/shares";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { isAdminEmail } from "../../../../lib/admin";

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
    const user = await getChatGPTUser();
    if (!user) {
      return Response.json({ error: "请先使用管理员账户登录" }, { status: 401 });
    }
    if (!isAdminEmail(user.email)) {
      return Response.json({ error: "当前账户没有管理员权限" }, { status: 403 });
    }

    const { id } = await context.params;
    const share = await getShare(id);
    if (!share) {
      return Response.json({ error: "没有找到这份分享" }, { status: 404 });
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
