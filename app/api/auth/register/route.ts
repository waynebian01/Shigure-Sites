import { assertSameOrigin, AuthError, register } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = (await request.json()) as { username?: unknown; password?: unknown };
    if (typeof body.username !== "string" || typeof body.password !== "string") {
      throw new AuthError("请输入账号和密码");
    }
    const user = await register(body.username, body.password);
    return Response.json({ user }, {
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}
