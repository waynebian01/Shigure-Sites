import { getCurrentUser } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return Response.json({
    authenticated: Boolean(user),
    isAdmin: user?.isAdmin ?? false,
    username: user?.username ?? null,
    displayName: user?.displayName ?? null,
  }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
