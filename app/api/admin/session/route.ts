import { getAdminStatus } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getAdminStatus();
  return Response.json(status, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
