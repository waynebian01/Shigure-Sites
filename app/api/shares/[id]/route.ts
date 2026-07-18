import { getShare, storageBindings } from "../../../../lib/shares";

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
