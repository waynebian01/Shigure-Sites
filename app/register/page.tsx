import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getChatGPTUser();

  return (
    <main className="auth-page">
      <Link className="auth-brand" href="/" aria-label="返回 Shigure 首页">
        <span className="brand-mark" aria-hidden="true">
          <img src="/brand/arasaka-icon-64.png" width={64} height={64} alt="" />
        </span>
        <span>Shigure</span>
      </Link>
      <section className="auth-card" aria-labelledby="register-title">
        <span className="auth-eyebrow">CREATE PROFILE</span>
        <h1 id="register-title">{user ? "档案已就绪" : "注册 Shigure"}</h1>
        <p>
          {user
            ? "你的身份已验证，可以直接进入个人中心。"
            : "通过 ChatGPT 安全验证身份。首次进入个人中心时会自动创建你的 Shigure 档案，无需设置新密码。"}
        </p>
        <ul className="auth-benefits">
          <li><span>01</span> 个人分享自动归档</li>
          <li><span>02</span> 随时下载或删除</li>
          <li><span>03</span> 不额外保存密码</li>
        </ul>
        <a className="auth-primary" href={user ? "/profile" : chatGPTSignInPath("/profile")}>
          {user ? "进入个人中心" : "使用 ChatGPT 注册"} <span>→</span>
        </a>
        <div className="auth-footnote">
          <span>已有账户？</span>
          <Link href="/login">返回登录</Link>
        </div>
      </section>
    </main>
  );
}
