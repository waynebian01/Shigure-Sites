import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getChatGPTUser();

  return (
    <main className="auth-page">
      <Link className="auth-brand" href="/" aria-label="返回 Shigure 首页">
        <span className="brand-mark" aria-hidden="true">
          <img src="/brand/arasaka-icon-64.png" width={64} height={64} alt="" />
        </span>
        <span>Shigure</span>
      </Link>
      <section className="auth-card" aria-labelledby="login-title">
        <span className="auth-eyebrow">WELCOME BACK</span>
        <h1 id="login-title">{user ? "你已登录" : "登录 Shigure"}</h1>
        <p>
          {user
            ? `当前账户：${user.displayName}`
            : "登录后可以分享 JSON，并在个人中心查看和管理自己的内容。"}
        </p>
        {user ? (
          <a className="auth-primary" href="/profile">前往个人中心 <span>→</span></a>
        ) : (
          <a className="auth-primary" href={chatGPTSignInPath("/profile")}>
            使用 ChatGPT 登录 <span>→</span>
          </a>
        )}
        <div className="auth-footnote">
          <span>还没有个人档案？</span>
          <Link href="/register">立即注册</Link>
        </div>
      </section>
    </main>
  );
}
