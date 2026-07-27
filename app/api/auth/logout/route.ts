import { assertSameOrigin, AuthError, logout } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await logout();
    const acceptsJson = request.headers.get("accept")?.includes("application/json");
    return acceptsJson
      ? Response.json({ loggedOut: true })
      : Response.redirect(new URL("/", request.url), 303);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: "退出失败，请稍后重试" }, { status: 500 });
  }
}
