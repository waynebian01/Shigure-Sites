import { getShare, storageBindings } from "../../../../../lib/shares";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const share = await getShare(id);
    if (!share) return new Response("Not found", { status: 404 });
    const object = await storageBindings().FILES.get(share.r2Key);
    if (!object) return new Response("Not found", { status: 404 });
    const encoded = encodeURIComponent(share.filename);
    return new Response(object.body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": String(share.size),
        "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Download unavailable", { status: 500 });
  }
}
